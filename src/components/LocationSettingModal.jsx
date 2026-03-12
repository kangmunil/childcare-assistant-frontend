import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, MapPin, Navigation, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

const TARGET_ACCURACY_METERS = 80;
const WARN_ACCURACY_METERS = 200;
const WATCH_TIMEOUT_MS = 12000;
const MAX_SAMPLE_COUNT = 5;
const REVERSE_GEOCODE_TIMEOUT_MS = 8000;
const REVERSE_GEOCODE_TIMEOUT_MESSAGE = '주소 확인 요청이 지연되고 있어요. 다시 시도해주세요.';

const pickFirstNonEmpty = (...values) => {
    for (const value of values) {
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }
    return '';
};

const toGeoErrorMessage = (error) => {
    const code = error?.code;
    switch (code) {
        case 1:
            return '위치 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
        case 2:
            return '위치 정보를 사용할 수 없습니다. GPS/Wi-Fi 상태를 확인해주세요.';
        case 3:
            return '위치 정보를 가져오는 시간이 초과되었습니다.';
        default:
            return '위치 정보를 가져올 수 없습니다.';
    }
};

const createAbortError = () => {
    if (typeof DOMException === 'function') {
        return new DOMException('요청이 취소되었습니다.', 'AbortError');
    }
    const error = new Error('요청이 취소되었습니다.');
    error.name = 'AbortError';
    return error;
};

const isAbortError = (error) => error?.name === 'AbortError';

const collectBestPosition = (signal) =>
    new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(createAbortError());
            return;
        }

        let watchId = null;
        let timeoutId = null;
        let settled = false;
        let bestPosition = null;
        let sampleCount = 0;
        const abortHandler = () => rejectOnce(createAbortError());

        const clearAll = () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
            if (signal) {
                signal.removeEventListener('abort', abortHandler);
            }
        };

        const resolveOnce = (position) => {
            if (settled) return;
            settled = true;
            clearAll();
            resolve(position);
        };

        const rejectOnce = (error) => {
            if (settled) return;
            settled = true;
            clearAll();
            reject(error);
        };

        if (signal) {
            signal.addEventListener('abort', abortHandler, { once: true });
        }

        watchId = navigator.geolocation.watchPosition(
            (position) => {
                sampleCount += 1;

                const accuracy = Number(position?.coords?.accuracy);
                const bestAccuracy = Number(bestPosition?.coords?.accuracy);
                const shouldReplace =
                    !bestPosition ||
                    (!Number.isFinite(bestAccuracy) && Number.isFinite(accuracy)) ||
                    (Number.isFinite(accuracy) && accuracy < bestAccuracy);

                if (shouldReplace) {
                    bestPosition = position;
                }

                if ((Number.isFinite(accuracy) && accuracy <= TARGET_ACCURACY_METERS) || sampleCount >= MAX_SAMPLE_COUNT) {
                    resolveOnce(bestPosition || position);
                }
            },
            (error) => {
                if (bestPosition) {
                    resolveOnce(bestPosition);
                    return;
                }
                rejectOnce(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        timeoutId = window.setTimeout(() => {
            if (bestPosition) {
                resolveOnce(bestPosition);
                return;
            }
            rejectOnce({ code: 3 });
        }, WATCH_TIMEOUT_MS);
    });

const reverseGeocode = async ({ latitude, longitude, signal }) => {
    if (signal?.aborted) {
        throw createAbortError();
    }

    const timeoutController = new AbortController();
    const timeoutId = window.setTimeout(() => {
        timeoutController.abort();
    }, REVERSE_GEOCODE_TIMEOUT_MS);

    const syncAbort = () => timeoutController.abort();
    if (signal) {
        signal.addEventListener('abort', syncAbort, { once: true });
    }

    try {
        const response = await api.get(`/geo/reverse?lat=${latitude}&lng=${longitude}`, {
            signal: timeoutController.signal
        });
        return response;
    } catch (error) {
        if (timeoutController.signal.aborted && !signal?.aborted) {
            throw new Error(REVERSE_GEOCODE_TIMEOUT_MESSAGE);
        }
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
        if (signal) {
            signal.removeEventListener('abort', syncAbort);
        }
    }
};

/**
 * GPS 기반 동네 인증 모달
 * - Browser Geolocation API로 현재 위치 획득
 * - Backend Proxy를 통해 Kakao API로 좌표 → 주소 변환
 * - 사용자 확인 후 저장
 */
const LocationSettingModal = ({ isOpen, onClose, onSave, currentRegionName }) => {
    const [status, setStatus] = useState('idle'); // idle, loading, confirm, error
    const [errorMessage, setErrorMessage] = useState('');
    const [detectedLocation, setDetectedLocation] = useState(null);
    const authAbortControllerRef = useRef(null);

    const resetModalState = useCallback(() => {
        setStatus('idle');
        setErrorMessage('');
        setDetectedLocation(null);
    }, []);

    const cancelLocationAuth = useCallback(() => {
        const controller = authAbortControllerRef.current;
        if (!controller) {
            return;
        }
        controller.abort();
        authAbortControllerRef.current = null;
    }, []);

    const handleModalClose = useCallback(() => {
        cancelLocationAuth();
        resetModalState();
        onClose();
    }, [cancelLocationAuth, onClose, resetModalState]);

    useEffect(() => () => {
        cancelLocationAuth();
    }, [cancelLocationAuth]);

    useEffect(() => {
        if (!isOpen) {
            cancelLocationAuth();
            resetModalState();
        }
    }, [isOpen, cancelLocationAuth, resetModalState]);

    // GPS로 현재 위치 인증하기
    const handleLocationAuth = useCallback(() => {
        if (!navigator.geolocation) {
            setErrorMessage('브라우저가 위치 정보를 지원하지 않습니다.');
            setStatus('error');
            return;
        }

        cancelLocationAuth();
        const controller = new AbortController();
        authAbortControllerRef.current = controller;

        setStatus('loading');
        setErrorMessage('');
        setDetectedLocation(null);

        (async () => {
            try {
                const position = await collectBestPosition(controller.signal);
                const { latitude, longitude, accuracy } = position.coords;

                // Backend Proxy를 통해 Kakao API 호출
                const response = await reverseGeocode({
                    latitude,
                    longitude,
                    signal: controller.signal
                });
                const data = response?.data || response;

                if (controller.signal.aborted) {
                    return;
                }

                if (data.documents && data.documents.length > 0) {
                    const doc = data.documents[0];
                    const roadAddr = doc.road_address || {};
                    const jibunAddr = doc.address || {};

                    const regionName = pickFirstNonEmpty(
                        data.preferredRegionName,
                        data.legalRegionName,
                        data.adminRegionName,
                        jibunAddr.region_3depth_name,
                        roadAddr.region_3depth_name,
                        jibunAddr.region_2depth_name,
                        '알 수 없음'
                    );

                    const fullAddress = pickFirstNonEmpty(
                        data.fullAddress,
                        roadAddr.address_name,
                        jibunAddr.address_name
                    );

                    const postcode = pickFirstNonEmpty(
                        roadAddr.zone_no,
                        jibunAddr.zip_code
                    );
                    const regionCode = pickFirstNonEmpty(
                        data.legalRegionCode,
                        data.adminRegionCode
                    );

                    const accuracyMeters = Number.isFinite(Number(accuracy))
                        ? Math.round(Number(accuracy))
                        : null;

                    setDetectedLocation({
                        regionName,
                        fullAddress,
                        postcode,
                        addr1: fullAddress,
                        lat: latitude,
                        lng: longitude,
                        accuracy: accuracyMeters,
                        regionCode
                    });
                    setStatus('confirm');
                } else {
                    setErrorMessage('해당 좌표의 주소를 찾을 수 없습니다.');
                    setStatus('error');
                }
            } catch (error) {
                if (controller.signal.aborted || isAbortError(error)) {
                    return;
                }
                console.error('Geolocation/reverse geocoding failed:', error);
                setErrorMessage(error?.message || toGeoErrorMessage(error));
                setStatus('error');
            } finally {
                if (authAbortControllerRef.current === controller) {
                    authAbortControllerRef.current = null;
                }
            }
        })();
    }, [cancelLocationAuth]);

    // 위치 확인 후 저장
    const handleConfirm = async () => {
        if (!detectedLocation) return;

        setStatus('loading');
        try {
            const result = await onSave({
                postcode: detectedLocation.postcode || '',
                addr1: detectedLocation.addr1,
                addr2: '',
                regionName: detectedLocation.regionName,
                regionCode: detectedLocation.regionCode || null
            });
            if (result && result.success === false) {
                throw new Error(result.message || '저장에 실패했습니다.');
            }
            handleModalClose();
        } catch (error) {
            setErrorMessage(error.message || '저장에 실패했습니다.');
            setStatus('error');
        }
    };

    // 다시 시도
    const handleRetry = () => {
        cancelLocationAuth();
        resetModalState();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl transform transition-all relative">

                {/* 헤더 */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg mb-2 inline-block">
                            📍 GPS 인증
                        </span>
                        <h3 className="text-xl font-black text-gray-800 dark:text-white">
                            동네 인증하기
                        </h3>
                        {currentRegionName && (
                            <p className="text-sm text-stone-500 dark:text-gray-400 mt-1">
                                현재 설정: {currentRegionName}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleModalClose}
                        className="p-2 bg-gray-50 dark:bg-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* 상태별 컨텐츠 */}
                {status === 'idle' && (
                    <>
                        <p className="text-sm text-stone-500 dark:text-gray-400 mb-6">
                            현재 위치를 기반으로 동네를 인증합니다.
                            <br />
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                실제 거주지에서 인증해주세요!
                            </span>
                        </p>

                        <button
                            onClick={handleLocationAuth}
                            className="w-full p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-amber-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Navigation className="w-6 h-6" />
                            현재 위치로 인증하기
                        </button>
                    </>
                )}

                {status === 'loading' && (
                    <div className="py-12 flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                        <p className="text-stone-600 dark:text-gray-300 font-medium">
                            {detectedLocation ? '동네 정보를 저장하고 있어요...' : '현재 위치를 여러 번 측정하고 있어요...'}
                        </p>
                    </div>
                )}

                {status === 'confirm' && detectedLocation && (
                    <>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-700 mb-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-green-700 dark:text-green-300 text-xl">
                                        {detectedLocation.regionName}
                                    </p>
                                    <p className="text-sm text-stone-600 dark:text-gray-400 mt-1">
                                        {detectedLocation.fullAddress}
                                    </p>
                                    {detectedLocation.accuracy != null && (
                                        <p className="text-xs text-stone-500 dark:text-gray-400 mt-2">
                                            위치 정확도: 약 {detectedLocation.accuracy}m
                                        </p>
                                    )}
                                    {detectedLocation.accuracy != null && detectedLocation.accuracy > WARN_ACCURACY_METERS && (
                                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                            현재 정확도가 낮아요. 실외에서 다시 시도하면 더 정확해집니다.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-stone-600 dark:text-gray-300 mb-4 font-medium">
                            이 위치로 동네를 설정할까요?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleRetry}
                                className="flex-1 py-3 bg-stone-100 dark:bg-gray-700 text-stone-600 dark:text-gray-300 rounded-xl font-bold hover:bg-stone-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                다시 시도
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                확인
                            </button>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-700 mb-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    {errorMessage}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleRetry}
                            className="w-full py-4 bg-stone-100 dark:bg-gray-700 text-stone-600 dark:text-gray-300 rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            다시 시도하기
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default LocationSettingModal;
