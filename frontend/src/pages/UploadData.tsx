import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Company, UploadResponse } from '../types';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, Flag, Plus, RefreshCw, Building2, ChevronDown, Users } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useDataCache } from '../context/DataCacheContext';

export default function UploadData() {
    const navigate = useNavigate();
    const { showToast, updateToast } = useToast();
    const { refreshAll } = useDataCache();
    const [file, setFile] = useState<File | null>(null);
    const [isNewCompany, setIsNewCompany] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [company, setCompany] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [roundNumber, setRoundNumber] = useState('');
    const [roundName, setRoundName] = useState('');
    const [isFinal, setIsFinal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<UploadResponse | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [runningCompanies, setRunningCompanies] = useState<Company[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(true);

    // Fetch running companies
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const companiesData = await api.request<Company[]>('/companies');
                const companies = companiesData
                    .filter(c => c.status === 'running')
                    .sort((a, b) => a.companyName.localeCompare(b.companyName));
                setRunningCompanies(companies);
            } catch (error) {
                console.error('Error fetching companies:', error);
            } finally {
                setLoadingCompanies(false);
            }
        };
        fetchCompanies();
    }, []);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
                setFile(droppedFile);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        if (!file) return;
        if (isNewCompany && (!company || !year)) return;
        if (!isNewCompany && !selectedCompanyId) return;

        setLoading(true);
        setResponse(null);

        // Get company name and year for toast
        const companyName = isNewCompany ? company : runningCompanies.find(c => c.companyYearId === selectedCompanyId)!.companyName;
        const companyYear = isNewCompany ? parseInt(year) : runningCompanies.find(c => c.companyYearId === selectedCompanyId)!.year;
        const roundNumText = roundNumber || 'Auto';
        const roundTypeText = isFinal ? 'Final Round' : `Round ${roundNumText}`;

        // Show loading toast
        const toastId = showToast({
            type: 'loading',
            title: 'Processing Upload',
            message: `${companyName} - ${roundTypeText}`
        });

        const formData = new FormData();
        formData.append('file', file);

        if (isNewCompany) {
            formData.append('company', company);
            formData.append('year', year);
            if (roundNumber) formData.append('roundNumber', roundNumber);
        } else {
            // For existing company, extract company name and year from the selected company
            const selectedCompany = runningCompanies.find(c => c.companyYearId === selectedCompanyId);
            if (selectedCompany) {
                formData.append('company', selectedCompany.companyName);
                formData.append('year', selectedCompany.year.toString());
            }
        }

        if (roundName) formData.append('roundName', roundName);
        formData.append('isFinal', isFinal.toString());

        try {
            // Use the new API client method that calls port 5005 with JWT
            const data = await api.uploadExcelRound(
                file,
                companyName,
                companyYear,
                roundNumber ? parseInt(roundNumber) : undefined,
                roundName || undefined,
                isFinal
            );
            setResponse(data);

            // Update toast to success
            if (data.success) {
                updateToast(toastId, {
                    type: 'success',
                    title: 'Upload Complete ✓',
                    message: `${companyName} - ${data.data?.matchedStudents} matched, ${data.data?.newStudents} new`
                });

                // ✅ SMART REFRESH: Refetch all data in background (no page reload!)
                console.log('🔄 Refetching all cached data after upload...');
                await refreshAll(); // Re-fetches data from API and updates cache
                console.log('✅ Cache refreshed with latest data');
            } else {
                updateToast(toastId, {
                    type: 'error',
                    title: 'Upload Failed',
                    message: data.error || 'Unknown error occurred'
                });
            }

            // If final round, navigate to placements overview after 2 seconds
            if (isFinal && data.success) {
                setTimeout(() => {
                    navigate('/placements');
                }, 2000);
            }
        } catch (error: unknown) {
            const errorMessage = (error as Error).message || 'Failed to connect to upload service.';
            setResponse({
                success: false,
                error: errorMessage,
            });

            // Update toast to error
            updateToast(toastId, {
                type: 'error',
                title: 'Upload Failed',
                message: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setCompany('');
        setSelectedCompanyId('');
        setYear(new Date().getFullYear().toString());
        setRoundNumber('');
        setRoundName('');
        setIsFinal(false);
        setResponse(null);
    };

    const canSubmit = file && (isNewCompany ? (company && year) : selectedCompanyId);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="glass-strong rounded-2xl p-8 border border-blue-500/20">
                <h1 className="text-4xl font-bold text-gradient-blue mb-2">Upload Round Data</h1>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Upload Excel files to add placement round data
                </p>
            </div>

            {/* Main Content - Single Column */}
            <div className="max-w-2xl mx-auto">
                {/* Upload Form */}
                <div className="glass-strong rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                            <Upload className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
                        </div>
                        Upload Excel File
                    </h2>

                    {/* Show Result if available */}
                    {response ? (
                        response.success ? (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                    <div>
                                        <p className="font-semibold text-green-600 dark:text-green-400">Upload Successful!</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{response.data?.roundId}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-3">
                                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30 text-center">
                                        <p className="text-2xl font-bold text-blue-500">{response.data?.totalStudents}</p>
                                        <p className="text-xs text-gray-500">Total</p>
                                    </div>
                                    <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30 text-center">
                                        <p className="text-2xl font-bold text-green-500">{response.data?.matchedStudents}</p>
                                        <p className="text-xs text-gray-500">Matched</p>
                                    </div>
                                    <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30 text-center">
                                        <p className="text-2xl font-bold text-yellow-500">{response.data?.newStudents}</p>
                                        <p className="text-xs text-gray-500">New</p>
                                    </div>
                                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30 text-center">
                                        <p className="text-2xl font-bold text-purple-500">{response.data?.placedStudents}</p>
                                        <p className="text-xs text-gray-500">Placed</p>
                                    </div>
                                </div>

                                <button
                                    onClick={resetForm}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
                                >
                                    Upload Another File
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                                    <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-red-600 dark:text-red-400">Upload Failed</p>
                                        <p className="text-sm text-red-500 mt-1">{response.error}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setResponse(null)}
                                    className="w-full py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
                                >
                                    Try Again
                                </button>
                            </div>
                        )
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Company Type Toggle */}
                            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setIsNewCompany(true)}
                                    className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isNewCompany
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <Plus className="h-4 w-4" />
                                    New Company
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsNewCompany(false)}
                                    className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${!isNewCompany
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Existing Company
                                </button>
                            </div>

                            {/* File Drop Zone */}
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${dragActive
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : file
                                        ? 'border-green-500 bg-green-500/10'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {file ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                                            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileSpreadsheet className="h-8 w-8 text-gray-400" />
                                        <p className="font-medium text-gray-900 dark:text-white">Drop Excel file or click to browse</p>
                                    </div>
                                )}
                            </div>

                            {/* Conditional Form Fields */}
                            {isNewCompany ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            placeholder="e.g., Google"
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Year *
                                        </label>
                                        <input
                                            type="number"
                                            value={year}
                                            onChange={(e) => setYear(e.target.value)}
                                            min="2000"
                                            max="2100"
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Round Number
                                        </label>
                                        <input
                                            type="number"
                                            value={roundNumber}
                                            onChange={(e) => setRoundNumber(e.target.value)}
                                            placeholder="Auto if empty"
                                            min="1"
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Round Name
                                        </label>
                                        <input
                                            type="text"
                                            value={roundName}
                                            onChange={(e) => setRoundName(e.target.value)}
                                            placeholder="e.g., Technical Round"
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Select Running Company *
                                        </label>
                                        {loadingCompanies ? (
                                            <div className="flex items-center justify-center gap-2 text-gray-500 py-8">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Loading companies...
                                            </div>
                                        ) : runningCompanies.length === 0 ? (
                                            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-sm text-center">
                                                No running companies found. Create a new company instead.
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 text-left flex items-center justify-between hover:bg-white dark:hover:bg-gray-800 transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    {selectedCompanyId ? (
                                                        (() => {
                                                            const c = runningCompanies.find(c => c.companyYearId === selectedCompanyId);
                                                            return c ? (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                                                        {c.companyName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <span className="block font-medium text-gray-900 dark:text-white">{c.companyName}</span>
                                                                        <span className="text-xs text-gray-500">{c.year} • Round {c.totalRounds}</span>
                                                                    </div>
                                                                </div>
                                                            ) : <span className="text-gray-500">Select a company...</span>;
                                                        })()
                                                    ) : (
                                                        <span className="text-gray-500">Select a company...</span>
                                                    )}
                                                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isDropdownOpen && (
                                                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
                                                        {runningCompanies.map(c => {
                                                            const isSelected = selectedCompanyId === c.companyYearId;
                                                            return (
                                                                <div
                                                                    key={c.companyYearId}
                                                                    onClick={() => {
                                                                        setSelectedCompanyId(c.companyYearId);
                                                                        setIsDropdownOpen(false);
                                                                    }}
                                                                    className={`p-3 cursor-pointer transition-colors border-b last:border-0 border-gray-100 dark:border-gray-700/50 ${isSelected
                                                                        ? 'bg-green-50 dark:bg-green-900/10'
                                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm ${isSelected
                                                                            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                                            : 'bg-gradient-to-br from-blue-500 to-purple-600'
                                                                            }`}>
                                                                            {c.companyName.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <h3 className={`font-medium ${isSelected ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                                                                    {c.companyName}
                                                                                </h3>
                                                                                {isSelected && <CheckCircle className="h-4 w-4 text-green-500" />}
                                                                            </div>
                                                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                                                <span className="flex items-center gap-1">
                                                                                    <Building2 className="h-3 w-3" />
                                                                                    {c.year}
                                                                                </span>
                                                                                <span className="flex items-center gap-1">
                                                                                    <Users className="h-3 w-3" />
                                                                                    {c.totalApplied} applied
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Round Name
                                        </label>
                                        <input
                                            type="text"
                                            value={roundName}
                                            onChange={(e) => setRoundName(e.target.value)}
                                            placeholder="e.g., HR Round"
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Final Round Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Flag className={`h-5 w-5 ${isFinal ? 'text-green-500' : 'text-gray-400'}`} />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">Final Round</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsFinal(!isFinal)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isFinal ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isFinal ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!canSubmit || loading}
                                className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-3 ${!canSubmit || loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-5 w-5" />
                                        Upload Round Data
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
