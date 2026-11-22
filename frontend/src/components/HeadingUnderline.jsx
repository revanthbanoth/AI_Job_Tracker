import React from 'react';

export const HeadingUnderline = ({ className = "text-primary" }) => {
    return (
        <svg
            className={`w-full h-3 -mt-1 ${className}`}
            viewBox="0 0 240 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
        >
            <path
                d="M3 8.5C45.2 3.8 112 2.8 237 8.2C178 4.5 98.5 4.8 5 10.5"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
            />
        </svg>
    );
};

export default HeadingUnderline;
