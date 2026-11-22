import React from 'react';

const Footer = ({ className = '' }) => {
    return (
        <footer className={`py-4 px-6 border-t border-border/40 text-center text-xs text-muted flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors duration-300 ${className}`}>
            <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>AI JobTracker &bull; Built with care</span>
            </div>
            <div className="text-muted/70">
                Developed by <span className="font-medium text-text">B Revanth Kumar</span>
            </div>
        </footer>
    );
};

export default Footer;
