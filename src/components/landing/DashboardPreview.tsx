import React, { useEffect, useRef } from 'react';

export const DashboardPreview: React.FC = () => {
    const chartBarsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const bars = entry.target.querySelectorAll('.chart-bar');
                        bars.forEach((bar, index) => {
                            setTimeout(() => {
                                (bar as HTMLElement).style.opacity = '1';
                            }, index * 100);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.3 }
        );

        if (chartBarsRef.current) {
            observer.observe(chartBarsRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section id="how-it-works" className="dashboard-preview">
            <div className="container">
                <div className="section-header text-center">
                    <h2>Abra o sistema e saiba exatamente como está seu negócio.</h2>
                    <p>Sem planilhas, sem anotações perdidas.</p>
                </div>

                <div className="dashboard-mockup">
                    <div className="mockup-window">
                        <div className="mockup-header">
                            <span className="dot red"></span>
                            <span className="dot yellow"></span>
                            <span className="dot green"></span>
                        </div>
                        <div className="mockup-body">
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <span className="stat-label">Clientes</span>
                                    <span className="stat-value text-primary">128</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Receita (Mês)</span>
                                    <span className="stat-value text-success">R$ 12.450</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">A Receber</span>
                                    <span className="stat-value text-warning">R$ 850</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Serviços Hoje</span>
                                    <span className="stat-value">5</span>
                                </div>
                            </div>
                            <div className="chart-placeholder" ref={chartBarsRef}>
                                <div className="chart-bar" style={{ height: '40%', opacity: 0 }}></div>
                                <div className="chart-bar" style={{ height: '60%', opacity: 0 }}></div>
                                <div className="chart-bar" style={{ height: '45%', opacity: 0 }}></div>
                                <div className="chart-bar" style={{ height: '80%', opacity: 0 }}></div>
                                <div className="chart-bar" style={{ height: '70%', opacity: 0 }}></div>
                                <div className="chart-bar" style={{ height: '90%', opacity: 0 }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
