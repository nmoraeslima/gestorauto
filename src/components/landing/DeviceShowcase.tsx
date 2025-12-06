import React from 'react';
import { motion } from 'framer-motion';

export const DeviceShowcase: React.FC = () => {
    return (
        <section id="showcase" className="py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                        Controle total. <br />
                        <span className="text-primary-600">Em qualquer dispositivo.</span>
                    </h2>
                    <p className="text-xl text-gray-600">
                        Seja no balcão da recepção, no tablet da oficina ou no celular em casa.
                        O GestorAuto te acompanha onde você estiver.
                    </p>
                </div>

                <div className="relative max-w-6xl mx-auto mt-20 h-[400px] md:h-[600px] lg:h-[700px]">
                    {/* Desktop Mockup (Center) */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-[90%] md:w-[75%] z-20 top-0 shadow-2xl rounded-xl border-4 border-gray-800 bg-gray-900 overflow-hidden">
                        <div className="aspect-[16/9] bg-gray-800 relative">
                            {/* Browser Bar */}
                            <div className="h-6 md:h-8 bg-gray-800 flex items-center px-4 space-x-2">
                                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                            </div>
                            <img
                                src="/landing/dashboard-desktop.png"
                                alt="Dashboard Desktop"
                                className="w-full h-full object-cover rounded-b-lg"
                            />
                        </div>
                    </div>

                    {/* Tablet Mockup (Left) */}
                    <div className="absolute top-[20%] -left-[5%] md:left-0 w-[55%] md:w-[40%] z-30 shadow-2xl rounded-[1.5rem] border-4 border-gray-800 bg-gray-900 overflow-hidden hidden sm:block transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                        <div className="aspect-[3/4] bg-gray-800 relative">
                            {/* Camera notch placeholder */}
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-black rounded-b-xl z-20"></div>
                            <img
                                src="/landing/app-tablet.png"
                                alt="App Tablet"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Mobile Mockup (Right) */}
                    <div className="absolute top-[35%] -right-[5%] md:right-[5%] w-[35%] md:w-[20%] z-40 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="rounded-[2.5rem] border-[8px] border-gray-900 bg-gray-900 overflow-hidden drop-shadow-2xl">
                            <img
                                src="/landing/app-mobile.png"
                                alt="App Mobile"
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
