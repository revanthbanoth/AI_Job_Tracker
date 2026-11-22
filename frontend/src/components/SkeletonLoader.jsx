export const StatCardSkeleton = () => (
    <div className="bg-card border border-border rounded-card p-5 shadow-warm">
        <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-28 bg-card-subtle rounded-md animate-pulse" />
            <div className="w-10 h-10 bg-card-subtle rounded-xl animate-pulse" />
        </div>
        <div className="h-9 w-16 bg-card-subtle rounded-lg mb-2 animate-pulse" />
        <div className="h-3 w-36 bg-card-subtle rounded-md animate-pulse" />
    </div>
);

export const ApplicationRowSkeleton = () => (
    <div className="bg-card border border-border rounded-card p-4 shadow-warm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-card-subtle rounded-xl shrink-0 animate-pulse" />
            <div className="space-y-2 flex-1">
                <div className="h-4 w-40 bg-card-subtle rounded-md animate-pulse" />
                <div className="h-3 w-64 bg-card-subtle rounded-md animate-pulse" />
            </div>
        </div>
        <div className="h-6 w-24 bg-card-subtle rounded-full animate-pulse" />
        <div className="h-8 w-8 bg-card-subtle rounded-lg animate-pulse" />
    </div>
);

export const DashboardSkeleton = () => (
    <div className="space-y-6 max-w-7xl mx-auto">
        <div className="space-y-2">
            <div className="h-8 w-72 bg-card-subtle rounded-lg animate-pulse" />
            <div className="h-4 w-96 bg-card-subtle rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <div className="h-32 bg-card border border-border rounded-card animate-pulse" />
        <div className="space-y-3">
            {[1, 2, 3].map(i => <ApplicationRowSkeleton key={i} />)}
        </div>
    </div>
);
