
export const preloadRoutes = () => {
    const routes = [
        import("@/pages/agenda"),
        import("@/pages/patients"),
        import("@/pages/reports-page"),
        import("@/pages/profile"),
        import("@/pages/subscription-management"),
    ];

    return Promise.all(routes);
};
