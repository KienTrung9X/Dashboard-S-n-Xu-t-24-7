import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { DashboardData } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { Sparkles, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';


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
    // 1. Convert markdown to basic HTML elements
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/^\s*\*\s+(.*)/gm, '<li>$1</li>'); // List items

    // 2. Handle newlines that aren't part of list structure
    html = html.replace(/\n/g, '<br />');

    // 3. Wrap consecutive <li> elements in a <ul>
    // This regex finds blocks of <li> tags, optionally separated by <br /> tags
    html = html.replace(/(?:<li>.*?<\/li>\s*(?:<br \/>)?\s*)+/g, (match) => {
        // Remove the <br /> tags from within the matched list block and wrap with <ul>
        return `<ul class="list-disc pl-5 space-y-1">${match.replace(/<br \/>/g, '')}</ul>`;
    });

    return { __html: html };
};


const AiAnalysis: React.FC<AiAnalysisProps> = ({ data, filters }) => {
    const { t, language } = useTranslation();
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateAnalysis = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysis('');

        try {
            if (!process.env.API_KEY) {
                console.warn("Gemini API key is not configured. AI analysis is disabled.");
                setError("API key is not configured.");
                setIsLoading(false);
                return;
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            // Create a simplified summary for a more focused and efficient prompt
            const summaryForAI = {
                filters: filters,
                summary: data.summary,
                top5Defects: data.quality.defectPareto.slice(0, 5),
                top5Downtime: data.downtime.downtimePareto.slice(0, 5),
            };

            const prompt = `Analyze the following manufacturing data summary for the period ${filters.startDate} to ${filters.endDate}. The language for the analysis should be ${language === 'vi' ? 'Vietnamese' : 'English'}.

Data Summary:
- Total Production: ${summaryForAI.summary.totalProduction.toLocaleString()} units
- Total Defects: ${summaryForAI.summary.totalDefects.toLocaleString()} units
- Total Downtime: ${summaryForAI.summary.totalDowntime.toLocaleString()} minutes
- Average OEE: ${(summaryForAI.summary.avgOee * 100).toFixed(1)}%

Top 5 Defect Reasons:
${summaryForAI.top5Defects.map(d => `- ${d.name}: ${d.value} units`).join('\n')}

Top 5 Downtime Reasons:
${summaryForAI.top5Downtime.map(d => `- ${d.name}: ${d.value} minutes`).join('\n')}

Based on this data, provide a brief analysis. Start with a short, bolded headline summarizing the key finding. Then, provide 2-3 bullet points highlighting key insights, potential root causes, or suggestions for improvement. Be concise and data-driven. Do not add any introductory or concluding phrases like "Here is the analysis".
`;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            
            setAnalysis(response.text);

        } catch (err: any) {
            console.error("AI analysis failed:", err);
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const InitialView = () => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm flex-grow">{t('aiAnalysisDesc')}</p>
            <button
                onClick={handleGenerateAnalysis}
                disabled={isLoading}
                className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-800 disabled:cursor-wait text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 transition-all transform hover:scale-105"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        {t('aiAnalyzing')}
                    </>
                ) : (
                    <>
                        <Sparkles size={16} />
                        {t('generateAnalysisButton')}
                    </>
                )}
            </button>
        </div>
    );

    const ResultView = () => (
        <div>
            <div className="prose prose-sm prose-invert max-w-none bg-black/20 p-4 rounded-md mb-4" dangerouslySetInnerHTML={renderMarkdown(analysis)} />
            <div className="flex justify-end">
                 <button
                    onClick={handleGenerateAnalysis}
                    disabled={isLoading}
                    className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-wait text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            {t('aiAnalyzing')}
                        </>
                    ) : (
                        <>
                            <RefreshCw size={14} />
                            {t('regenerate')}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
    
     const ErrorView = () => (
        <div className="bg-red-900/40 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-400" size={20} />
                <div>
                    <p className="font-semibold text-red-300">{t('analysisFailed')}</p>
                    <p className="text-xs text-red-400">{error}</p>
                </div>
            </div>
            <button
                onClick={handleGenerateAnalysis}
                className="bg-red-500/50 hover:bg-red-500/80 text-white font-bold py-1 px-3 text-sm rounded-md"
            >
                {t('tryAgain')}
            </button>
        </div>
    );

    return (
        <section className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
            <h2 className="text-xl font-semibold text-cyan-400 mb-3">{t('aiAnalysisTitle')}</h2>
            {error ? <ErrorView /> : analysis ? <ResultView /> : <InitialView />}
        </section>
    );
};

export default AiAnalysis;
