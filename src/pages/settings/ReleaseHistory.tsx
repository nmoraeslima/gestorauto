import React, { useEffect, useState } from 'react';
import {
    GitBranch,
    Calendar,
    ChevronDown,
    ChevronUp,
    Sparkles,
    ShieldCheck,
    Zap,
    Rocket,
    CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePWA } from '@/hooks/usePWA';

interface ReleaseNote {
    version: string;
    date: string;
    title: string;
    description: string;
    type: 'major' | 'minor' | 'patch';
    notes: { type: string; text: string; }[];
}

export const ReleaseHistory: React.FC = () => {
    const [releases, setReleases] = useState<ReleaseNote[]>([]);
    const [openVersions, setOpenVersions] = useState<string[]>([]);
    const { needRefresh, updateServiceWorker } = usePWA();

    useEffect(() => {
        fetch('/release.json')
            .then(res => res.json())
            .then(data => {
                if (data.releases) {
                    setReleases(data.releases);
                    // Open the first one by default
                    if (data.releases.length > 0) {
                        setOpenVersions([data.releases[0].version]);
                    }
                }
            })
            .catch(console.error);
    }, []);

    const toggleVersion = (version: string) => {
        if (openVersions.includes(version)) {
            setOpenVersions(openVersions.filter(v => v !== version));
        } else {
            setOpenVersions([...openVersions, version]);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'feat':
            case 'major': return <Sparkles className="w-4 h-4 text-primary-600" />;
            case 'fix': return <CheckCircle2 className="w-4 h-4 text-success-600" />;
            case 'sec': return <ShieldCheck className="w-4 h-4 text-secondary-600" />;
            case 'ui': return <Sparkles className="w-4 h-4 text-warning-600" />;
            default: return <GitBranch className="w-4 h-4 text-gray-400" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'feat': return 'NOVO';
            case 'fix': return 'CORREÇÃO';
            case 'sec': return 'SEGURANÇA';
            case 'ui': return 'VISUAL';
            default: return type.toUpperCase();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-secondary-500 mb-4">
                <Link to="/settings" className="hover:text-primary-600 transition-colors">Configurações</Link>
                <span>/</span>
                <span className="text-secondary-900 font-medium">Histórico de Versões</span>
            </div>

            {/* Banner - GestorAuto Brand Colors (Lighter/Vibrant) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary-600 to-primary-500 p-8 text-white shadow-lg">
                <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                            <Rocket className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold mb-2 text-white">Sempre evoluindo com você</h1>
                            <p className="text-primary-50 max-w-2xl leading-relaxed">
                                Estamos constantemente criando novas possibilidades. Aqui você confere todas as novidades
                                e recursos exclusivos que nossa equipe desenvolve para tornar a sua gestão cada vez
                                mais simples, poderosa e eficiente.
                            </p>
                        </div>
                    </div>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap gap-3 mt-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                            <span className="text-sm font-medium text-white">Novas Possibilidades</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                            <Rocket className="w-4 h-4 text-primary-100" />
                            <span className="text-sm font-medium text-white">Funcionalidades Exclusivas</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                            <Zap className="w-4 h-4 text-blue-200" />
                            <span className="text-sm font-medium text-white">Gestão Inteligente</span>
                        </div>
                    </div>
                </div>

                {/* Decorator Circles - Brand Colors */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-secondary-500/20 blur-2xl"></div>
            </div>

            {/* Update Action (If available) */}
            {needRefresh && (
                <div className="bg-white border-l-4 border-warning-400 p-4 rounded-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Rocket className="w-5 h-5 text-warning-500 animate-pulse" />
                        <div>
                            <h3 className="font-semibold text-gray-900">Nova atualização disponível!</h3>
                            <p className="text-sm text-gray-600">Uma nova versão do sistema está pronta para ser instalada.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="btn btn-primary"
                    >
                        Atualizar Agora
                    </button>
                </div>
            )}

            {/* Timeline */}
            <div className="space-y-4">
                {releases.map((release, index) => {
                    const isOpen = openVersions.includes(release.version);
                    const isLatest = index === 0;

                    return (
                        <div
                            key={release.version}
                            className={`bg-white rounded-xl border transition-all duration-200 ${isLatest ? 'border-primary-200 shadow-md' : 'border-gray-100 shadow-sm'
                                }`}
                        >
                            <button
                                onClick={() => toggleVersion(release.version)}
                                className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors rounded-xl"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${isLatest ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className={`font-bold ${isLatest ? 'text-primary-700' : 'text-gray-900'}`}>
                                                Versão {release.version}
                                            </h2>
                                            {isLatest && (
                                                <span className="px-2 py-0.5 text-xs font-bold bg-primary-100 text-primary-700 rounded-full">
                                                    ATUAL
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            {new Date(release.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            {release.title}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-gray-400">
                                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                            </button>

                            {/* Content */}
                            {isOpen && (
                                <div className="px-6 pb-6 pt-2 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                    <p className="text-gray-600 mb-6 italic text-sm border-l-2 border-primary-200 pl-3">
                                        "{release.description}"
                                    </p>

                                    <div className="space-y-3">
                                        {release.notes.map((note, i) => (
                                            <div key={i} className="flex items-start gap-3 group">
                                                <div className="mt-0.5 p-1 rounded bg-gray-50 group-hover:bg-white transition-colors">
                                                    {getTypeIcon(note.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                            {getTypeLabel(note.type)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 leading-relaxed">
                                                        {note.text}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
