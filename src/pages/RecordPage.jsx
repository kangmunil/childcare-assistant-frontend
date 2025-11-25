import React from 'react';
import { NotebookPen } from 'lucide-react';

const RecordPage = () => {
    return (
        <div className="text-center p-8 bg-white rounded-xl shadow-md space-y-4">
            <NotebookPen className="w-10 h-10 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-800">육아 일지 작성</h2>
            <p className="text-gray-500">신생아/유아기별 기록 항목을 입력하는 폼 설계가 필요합니다.</p>
        </div>
    );
};

export default RecordPage;