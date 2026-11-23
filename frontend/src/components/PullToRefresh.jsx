import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * PullToRefresh provides a smooth, native-like pull-down-to-refresh interaction
 * for mobile devices and touchscreens.
 * 
 * Works seamlessly across Android Chrome, iOS Safari, Samsung Internet, and in-app webviews.
 */
export default function PullToRefresh({ children, onRefresh, className = '', scrollContainerRef = null }) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const internalRef = useRef(null);
    const containerRef = scrollContainerRef || internalRef;

    const startY = useRef(0);
    const startX = useRef(0);
    const isPullActive = useRef(false);
    const THRESHOLD = 65; // pixels to trigger refresh

    const handleTouchStart = useCallback((e) => {
        if (isRefreshing) return;
        const target = containerRef.current || e.currentTarget;
        const scrollElement = target.closest('main') || target.parentElement || target;
        const scrollTop = scrollElement.scrollTop || window.scrollY || 0;

        // Only start pull-to-refresh when user is at the very top of scroll container
        if (scrollTop <= 2) {
            startY.current = e.touches[0].clientY;
            startX.current = e.touches[0].clientX;
            isPullActive.current = true;
            setIsDragging(true);
        } else {
            isPullActive.current = false;
        }
    }, [isRefreshing, containerRef]);

    const handleTouchMove = useCallback((e) => {
        if (!isPullActive.current || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const deltaY = currentY - startY.current;
        const deltaX = Math.abs(currentX - startX.current);

        const target = containerRef.current || e.currentTarget;
        const scrollElement = target.closest('main') || target.parentElement || target;
        const scrollTop = scrollElement.scrollTop || window.scrollY || 0;

        // Cancel if user has scrolled down into content or swiping horizontally
        if (scrollTop > 2 || deltaX > Math.abs(deltaY) * 1.2) {
            isPullActive.current = false;
            setIsDragging(false);
            setPullDistance(0);
            return;
        }

        if (deltaY > 0) {
            // Damped logarithmic pull resistance curve
            const dampedDistance = Math.min(Math.pow(deltaY, 0.82) * 1.8, 85);
            setPullDistance(dampedDistance);
        } else {
            setPullDistance(0);
        }
    }, [isRefreshing, containerRef]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPullActive.current) return;
        isPullActive.current = false;
        setIsDragging(false);

        if (pullDistance >= THRESHOLD && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(THRESHOLD); // Hold position while refreshing

            // Haptic vibration feedback on supported devices
            if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                try {
                    window.navigator.vibrate(25);
                } catch {
                    // Ignore vibration errors
                }
            }

            try {
                if (onRefresh) {
                    await onRefresh();
                } else {
                    // Default action: reload the page smoothly
                    window.location.reload();
                    return;
                }
            } catch (err) {
                console.error('[PullToRefresh] Refresh failed:', err);
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [pullDistance, isRefreshing, onRefresh]);

    const isVisible = pullDistance > 0 || isRefreshing;

    return (
        <div
            ref={scrollContainerRef ? undefined : internalRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative ${className}`}
        >
            {/* Visual Pull-to-Refresh Floating Indicator */}
            {isVisible && (
                <div
                    style={{
                        transform: `translate(-50%, ${Math.max(pullDistance * 0.75, isRefreshing ? 38 : 0)}px)`,
                        opacity: isRefreshing ? 1 : Math.min(pullDistance / 35, 1),
                        transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
                    }}
                    className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-warm-lg backdrop-blur-md text-xs font-semibold text-text select-none transition-colors duration-300"
                >
                    <RefreshCw
                        size={15}
                        className={`text-primary transition-transform duration-200 ${
                            isRefreshing ? 'animate-spin' : ''
                        }`}
                        style={{
                            transform: isRefreshing ? undefined : `rotate(${Math.min(pullDistance * 5, 360)}deg)`
                        }}
                    />
                    <span>
                        {isRefreshing
                            ? 'Refreshing...'
                            : pullDistance >= THRESHOLD
                            ? 'Release to refresh'
                            : 'Pull down to refresh'}
                    </span>
                </div>
            )}

            {children}
        </div>
    );
}
