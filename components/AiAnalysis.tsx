import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { DashboardData } from '../types';

interface AiAnalysisProps {
    data: DashboardData;
    filters: {
        startDate: string;
        endDate: string;
        area: string;
        shift: string;
        mode: string;
    }
}

// A simple markdown to HTML renderer
const renderMarkdown = (text: string) => {
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/^\* (.*$)/gm, '<li>$1</li>') // List items
        .replace(/(<li>(.|\n|\r)*?<\/li>)/g, '<ul class="list-disc pl-5 space-y-1">$1</ul>') // Wrap lists
        .replace(/\n/g, '<br />') // Newlines
        .replace(/<br \/>\s*<ul/g, '<ul') // Cleanup
        .replace(/<\/ul>\s*<br \/>/g, '</ul>');
    return { __html: html };
};


const AiAnalysis: React.FC<AiAnalysisProps> = ({ data, filters }) => {
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Clear analysis when data/filters change
    useEffect(() => {
        setAnalysis('');
        setError('');
    }, [data, filters]);

    const handleGenerateAnalysis = async () => {
        setIsLoading(true);
        setError('');
        setAnalysis('');

        try {
            if (!process.env.API_KEY) {
                throw new Error("API key is not configured.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const dataSummary = {
                summary: data.summary,
                top_defects: data.quality.defectPareto.slice(0, 3).map(d => ({name: d.name, value: d.value})),
                top_downtime: data.downtime.downtimePareto.slice(0, 3).map(d => ({name: d.name, value: d.value})),
                top_downtime_machines: data.downtime.top5DowntimeMachines.slice(0,3)
            };

            const filterContext = `Khu vực: ${filters.area}, Ca: ${filters.shift === 'all' ? 'Cả ngày' : filters.shift}, ${filters.mode === 'single' ? `Ngày: ${filters.startDate}`: `Khoảng ngày: ${filters.startDate} đến ${filters.endDate}`}.`

            const prompt = `
                Bạn là một chuyên gia phân tích sản xuất. Dựa vào dữ liệu JSON tóm tắt sau đây, hãy cung cấp một bản phân tích ngắn gọn bằng TIẾNG VIỆT.
                
                Bối cảnh: ${filterContext}

                Dữ liệu:
                ${JSON.stringify(dataSummary, null, 2)}

                Yêu cầu phân tích:
                1.  Tóm tắt tổng quan về OEE và sản lượng.
                2.  Chỉ ra yếu tố lớn nhất ảnh hưởng tiêu cực đến hiệu suất (dựa trên thời gian dừng máy hoặc loại lỗi nổi bật nhất).
                3.  Nêu một điểm sáng, khu vực hoạt động tốt.
                4.  Đưa ra một đề xuất cụ thể để cải thiện.

                Định dạng câu trả lời của bạn bằng Markdown, sử dụng dấu hoa thị (*) cho danh sách và dấu sao đôi (**) để nhấn mạnh. KHÔNG sử dụng tiêu đề Markdown (dấu #).
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            setAnalysis(response.text);

        } catch (err) {
            console.error("Gemini API call failed:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while communicating with the AI.";
            setError(`Không thể tạo phân tích: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section>
             <h2 className="text-2xl font-semibold text-purple-400 mb-4 border-l-4 border-purple-400 pl-3">
                AI-Powered Analysis
            </h2>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                {!analysis && !isLoading && !error && (
                    <div className="text-center">
                         <p className="text-gray-400 mb-4">Nhấp để tạo bản tóm tắt và thông tin chi tiết bằng AI dựa trên các bộ lọc hiện tại của bạn.</p>
                        <button
                            onClick={handleGenerateAnalysis}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2 mx-auto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Generate Analysis
                        </button>
                    </div>
                )}
                
                {isLoading && (
                     <div className="flex items-center justify-center text-center p-4">
                        <svg className="animate-spin h-6 w-6 text-purple-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-purple-300">AI đang phân tích dữ liệu...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-md">
                        <p className="font-semibold mb-2">Analysis Failed</p>
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={handleGenerateAnalysis}
                            className="mt-4 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 mx-auto"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {analysis && (
                     <div className="text-gray-300 space-y-2 leading-relaxed animate-fade-in-up">
                        <div dangerouslySetInnerHTML={renderMarkdown(analysis)} />
                         <button
                            onClick={handleGenerateAnalysis}
                            disabled={isLoading}
                            className="mt-4 text-sm text-purple-400 hover:text-purple-300 disabled:text-gray-500 flex items-center gap-1"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                            Regenerate
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default AiAnalysis;