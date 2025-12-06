import React from 'react';

export const Testimonials: React.FC = () => {
    return (
        <section className="testimonials bg-gray-50 border-t border-gray-100 py-16">
            <div className="container text-center max-w-4xl mx-auto">
                <div className="flex justify-center gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
                <p className="text-xl md:text-2xl font-serif italic text-gray-700 leading-relaxed">
                    "O GestorAuto foi desenvolvido lado a lado com profissionais de estética automotiva para resolver
                    os desafios reais do dia a dia. Tecnologia feita por quem entende de carro, para quem vive de carro."
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                    <span className="h-px w-12 bg-primary-200"></span>
                    <span className="text-sm font-semibold text-primary-600 uppercase tracking-widest">Excelência Comprovada</span>
                    <span className="h-px w-12 bg-primary-200"></span>
                </div>
            </div>
        </section>
    );
};
