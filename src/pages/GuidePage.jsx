import React from 'react';
import { BookOpen } from 'lucide-react';

const GuidePage = () => {
    return (
        <div className="text-center p-8 bg-white rounded-xl shadow-md space-y-4">
            <BookOpen className="w-10 h-10 text-purple-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-800">육아 가이드</h2>
            <p className="text-gray-500">프리미엄 육아 정보를 확인하는 페이지입니다.</p>
        </div>
    );
};

export default GuidePage;