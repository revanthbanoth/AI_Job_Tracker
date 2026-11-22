import { useState, useRef } from 'react';
import { Download, Printer, FileText, Check, X, Sparkles, Building2, Calendar, Award } from 'lucide-react';
import { exportApplicationsToCsv } from '../utils/calendarExport';

const ExportModal = ({ isOpen, onClose, applications = [] }) => {
    const [downloaded, setDownloaded] = useState(false);
    const printRef = useRef(null);

    if (!isOpen) return null;

    const total = applications.length;
    const interviews = applications.filter(a => a.status === 'Interviewing' || a.status === 'Interview').length;
    const offers = applications.filter(a => a.status === 'Offer').length;
    const active = applications.filter(a => a.status !== 'Rejected' && a.status !== 'Offer').length;

    const handleCsvExport = () => {
        exportApplicationsToCsv(applications);
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 3000);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-modal shadow-warm-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card-subtle/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Download size={18} />
                        </div>
                        <div>
                            <h3 className="font-serif text-lg font-bold text-text">Export Job Search Data</h3>
                            <p className="text-xs text-muted font-sans">Download spreadsheets or print an executive summary report.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-muted hover:text-text rounded-lg hover:bg-card transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Export Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Option 1: CSV Export */}
                        <div className="p-4 rounded-card border border-border bg-card-subtle/40 hover:border-primary/40 transition-colors flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary font-mono uppercase">Spreadsheet</span>
                                    <FileText size={16} className="text-muted" />
                                </div>
                                <h4 className="font-serif font-bold text-base text-text mb-1">CSV Pipeline Export</h4>
                                <p className="text-xs text-muted leading-relaxed font-sans">
                                    Complete raw export containing all {total} applications, company links, salary, notes, and dates. Perfect for Excel and Google Sheets.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCsvExport}
                                className={`mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-warm-sm ${
                                    downloaded
                                        ? 'bg-sage text-white'
                                        : 'bg-primary hover:bg-primary-hover text-white'
                                }`}
                            >
                                {downloaded ? (
                                    <>
                                        <Check size={14} />
                                        <span>Downloaded CSV!</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={14} />
                                        <span>Download CSV ({total} items)</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Option 2: Print / PDF Summary */}
                        <div className="p-4 rounded-card border border-border bg-card-subtle/40 hover:border-amber/40 transition-colors flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber/15 text-amber font-mono uppercase">Document</span>
                                    <Printer size={16} className="text-muted" />
                                </div>
                                <h4 className="font-serif font-bold text-base text-text mb-1">Executive Summary (PDF)</h4>
                                <p className="text-xs text-muted leading-relaxed font-sans">
                                    Clean, formatted summary report suitable for career coaches, mentors, or weekly personal reviews. Includes funnel metrics.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-amber/20 hover:bg-amber/30 text-amber-800 dark:text-amber-300 border border-amber/30 transition-all cursor-pointer shadow-warm-sm"
                            >
                                <Printer size={14} />
                                <span>Print / Save as PDF</span>
                            </button>
                        </div>
                    </div>

                    {/* Printable Preview Container */}
                    <div className="border border-border rounded-xl p-5 bg-card" id="printable-summary" ref={printRef}>
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                            <div>
                                <h4 className="font-serif font-bold text-base text-text">AI JobTracker Pipeline Summary</h4>
                                <p className="text-[11px] text-muted">Generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-card-subtle text-muted border border-border">
                                {total} Total Opportunities
                            </span>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-4 gap-2 text-center mb-4">
                            <div className="p-2.5 rounded-lg bg-card-subtle border border-border">
                                <div className="text-xs text-muted">Active</div>
                                <div className="text-lg font-bold font-serif text-text">{active}</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-card-subtle border border-border">
                                <div className="text-xs text-muted">Interviews</div>
                                <div className="text-lg font-bold font-serif text-amber">{interviews}</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-card-subtle border border-border">
                                <div className="text-xs text-muted">Offers</div>
                                <div className="text-lg font-bold font-serif text-sage">{offers}</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-card-subtle border border-border">
                                <div className="text-xs text-muted">Interview Rate</div>
                                <div className="text-lg font-bold font-serif text-primary">
                                    {total > 0 ? Math.round((interviews / total) * 100) : 0}%
                                </div>
                            </div>
                        </div>

                        {/* Recent Opportunities */}
                        <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Key Active Opportunities</div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {applications.slice(0, 6).map((app, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded bg-card-subtle/50 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-text">{app.company}</span>
                                        <span className="text-muted">• {app.position}</span>
                                    </div>
                                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary">
                                        {app.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-border bg-card-subtle/30 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-card hover:bg-card-subtle text-text border border-border rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
