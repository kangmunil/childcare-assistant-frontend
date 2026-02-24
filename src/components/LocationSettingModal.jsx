import React, { useState, useCallback } from 'react';
import { X, MapPin, Navigation, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

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

    // GPS로 현재 위치 인증하기
    const handleLocationAuth = useCallback(() => {
        if (!navigator.geolocation) {
            setErrorMessage('브라우저가 위치 정보를 지원하지 않습니다.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Backend Proxy를 통해 Kakao API 호출
                    const response = await api.get(`/geo/reverse?lat=${latitude}&lng=${longitude}`);
                    const data = response?.data || response;

                    if (data.documents && data.documents.length > 0) {
                        const doc = data.documents[0];
                        const roadAddr = doc.road_address;
                        const jibunAddr = doc.address;

                        // 법정동 우선, 없으면 도로명 주소에서 추출
                        const regionName = jibunAddr?.region_3depth_name ||
                            roadAddr?.region_3depth_name ||
                            jibunAddr?.region_2depth_name ||
                            '알 수 없음';

                        const fullAddress = roadAddr?.address_name || jibunAddr?.address_name || '';
                        const postcode = roadAddr?.zone_no || '';

                        setDetectedLocation({
                            regionName,
                            fullAddress,
                            postcode,
                            addr1: fullAddress,
                            lat: latitude,
                            lng: longitude
                        });
                        setStatus('confirm');
                    } else {
                        setErrorMessage('해당 좌표의 주소를 찾을 수 없습니다.');
                        setStatus('error');
                    }
                } catch (error) {
                    console.error('Reverse geocoding failed:', error);
                    setErrorMessage(error?.message || '주소 변환에 실패했습니다.');
                    setStatus('error');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                let msg = '위치 정보를 가져올 수 없습니다.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        msg = '위치 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = '위치 정보를 사용할 수 없습니다.';
                        break;
                    case error.TIMEOUT:
                        msg = '위치 정보 요청 시간이 초과되었습니다.';
                        break;
                }
                setErrorMessage(msg);
                setStatus('error');
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    }, []);

    // 위치 확인 후 저장
    const handleConfirm = async () => {
        if (!detectedLocation) return;

        setStatus('loading');
        try {
            await onSave({
                postcode: detectedLocation.postcode || '',
                addr1: detectedLocation.addr1,
                addr2: '',
                regionName: detectedLocation.regionName
            });
            onClose();
        } catch (error) {
            setErrorMessage(error.message || '저장에 실패했습니다.');
            setStatus('error');
        }
    };

    // 다시 시도
    const handleRetry = () => {
        setStatus('idle');
        setErrorMessage('');
        setDetectedLocation(null);
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
                        onClick={onClose}
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
                            현재 위치를 확인하고 있어요...
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
