import { useState, useEffect } from 'react';
import { useAuth } from '../../../core/context/AuthContext';
import { useGlobalState } from '../../../core/context/GlobalStateContext';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';
import { useTranslation } from '../../../core/hooks/useTranslation';

import { BottomNavigation } from '../components/BottomNavigation';
import { useMaleNavigation } from '../hooks/useMaleNavigation';

export const ReferralPage = () => {
    const { t } = useTranslation();
  
    const { user } = useAuth();
    const { appSettings } = useGlobalState();
    const { navigationItems, handleNavigationClick } = useMaleNavigation();
    const [copied, setCopied] = useState(false);

    const referralId = user?.referralId || 'MATCH101';
    const referralCount = user?.referralCount || 0;
    const rewardAmount = appSettings?.referral?.rewardAmount || 200;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareMessage = `Hey! Join me on Dil Mate and find amazing connections. Use my referral ID: ${referralId} during signup to get a special bonus! 🚀`;

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Join Dil Mate',
                text: shareMessage,
                url: window.location.origin,
            });
        } else {
            handleCopy();
        }
    };

    return (
        <div className="bg-[#fff8fb] dark:bg-[#0a0a0a] min-h-screen pb-32 relative overflow-hidden font-display selection:bg-primary selection:text-white antialiased">
            {/* Background Decor */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-pink-500/5 blur-[120px] rounded-full animate-blob-shift" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 blur-[120px] rounded-full animate-blob-shift" style={{ animationDelay: '-6s' }} />
            </div>

            {/* Header Removed for Immersive View */}


            <div className="max-w-md mx-auto w-full flex flex-col relative z-10">
                <main className="p-4 space-y-8 mt-2">
                    {/* Premium Reward Hero */}
                    <div className="relative group">
                        {/* Glow Behind Hero */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-rose-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        
                        <div className="relative skeuo-card bg-mesh-glass bg-premium-pink text-white rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
                            {/* Animated Background Icon */}
                            <div className="absolute -top-6 -right-6 opacity-10 rotate-12 transition-transform group-hover:scale-110 duration-700">
                                <MaterialSymbol name="redeem" size={200} filled />
                            </div>

                            <div className="relative z-10 space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90 drop-shadow-sm">{t('Invite Your Circle')}</span>
                                <h2 className="text-4xl font-black tracking-tighter leading-tight bg-clip-text text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.15)]">
                                    {t('Invite & Get')}
                                </h2>
                                
                                <div className="flex items-center gap-3 py-4">
                                    <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4 border border-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-black text-glow-gold text-[#FFD93D]">{rewardAmount}</span>
                                            <span className="text-xs font-black uppercase tracking-widest text-[#FFD93D] opacity-90">{t('Coins')}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-0.5 w-12 bg-white/30 rounded-full mb-2"></div>
                                        <p className="text-[11px] font-black leading-relaxed text-white drop-shadow-sm">
                                            {t('per each successful registration')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 items-end flex px-8 pb-4 pointer-events-none">
                                <p className="text-[10px] font-black tracking-wide text-white/80 uppercase">Limitless earning potential</p>
                            </div>
                        </div>
                    </div>

                    {/* Referral ID "The Vault" */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                             <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('Your Secret Code')}</h3>
                             <div className="h-px flex-1 bg-slate-100 dark:bg-white/5 mx-4"></div>
                        </div>
                        
                        <div className="skeuo-card rounded-[2rem] p-5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-mesh-glass opacity-30 pointer-events-none" />
                            
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="flex-1 skeuo-inset rounded-2xl p-4 flex items-center justify-center bg-gray-50 dark:bg-black/40">
                                    <span className="text-2xl font-black tracking-[.25em] text-primary font-mono drop-shadow-[0_4px_8px_rgba(255,77,109,0.1)]">
                                        {referralId}
                                    </span>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className={`skeuo-button-bold flex-shrink-0 flex items-center gap-2 px-6 h-[64px] rounded-2xl transition-all duration-300 ${copied ? 'from-green-500 to-emerald-600' : ''}`}
                                >
                                    <MaterialSymbol name={copied ? 'check' : 'content_copy'} size={24} className="text-white" />
                                    <span className="text-xs font-black uppercase tracking-widest text-white">{copied ? t('Done') : t('Copy')}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* How it works - Visual Flow */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">{t('How the Magic Happens')}</h3>
                        
                        <div className="relative pl-8 space-y-6">
                            {/* Visual Timeline Line */}
                            <div className="absolute left-3.5 top-2 bottom-8 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full opacity-20"></div>

                            {[
                                { 
                                    icon: 'share_windows', 
                                    title: t('Broadcast your link'), 
                                    desc: t('Send your unique link to your trusted circle.'),
                                    color: 'text-blue-500', 
                                    bgColor: 'bg-blue-500/10' 
                                },
                                { 
                                    icon: 'how_to_reg', 
                                    title: t('The onboarding'), 
                                    desc: t('Your contacts register using your unique secret code.'),
                                    color: 'text-purple-500', 
                                    bgColor: 'bg-purple-500/10' 
                                },
                                { 
                                    icon: 'token', 
                                    title: t('Claim the bounty'), 
                                    desc: `${t('You receive')} ${rewardAmount} ${t('coins added to your vault instantly.')}`,
                                    color: 'text-amber-500', 
                                    bgColor: 'bg-amber-500/10' 
                                }
                            ].map((step, i) => (
                                <div key={i} className="relative group transition-all hover:translate-x-1 duration-300">
                                    {/* Connecting Dot */}
                                    <div className="absolute -left-[24px] top-4 size-4 rounded-full border-4 border-white dark:border-[#0a0a0a] bg-primary z-10 shadow-[0_0_8px_rgba(255,77,109,0.4)]"></div>
                                    
                                    <div className="glass-card rounded-[1.5rem] p-4 flex gap-4 transition-all duration-300 hover:shadow-lg border-white/60 dark:border-white/10">
                                        <div className={`size-12 rounded-2xl skeuo-inset flex-shrink-0 flex items-center justify-center ${step.bgColor}`}>
                                            <MaterialSymbol name={step.icon} size={28} className={step.color} filled />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{step.title}</h4>
                                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Referral Stats "The Trophy Cabinet" */}
                    <div className="skeuo-card rounded-[2.5rem] p-6 relative overflow-hidden group">
                         <div className="absolute inset-0 bg-mesh-glass opacity-30" />
                         
                         <div className="flex items-center justify-between relative z-10">
                             <div className="flex flex-col">
                                 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('Your Referrals')}</span>
                                 <h4 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mt-1">{referralCount}</h4>
                             </div>
                             <div className="size-16 skeuo-inset rounded-[1.5rem] flex items-center justify-center bg-blue-50 dark:bg-blue-900/10 shadow-[inner_0_4px_10px_rgba(0,0,0,0.05)]">
                                 <MaterialSymbol name="groups" className="text-blue-500 drop-shadow-[0_4px_8px_rgba(59,130,246,0.2)]" size={36} filled />
                             </div>
                         </div>
                         
                         <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 uppercase tracking-[0.2em]">
                             {t('Successful connection bonus active')}
                         </p>
                    </div>

                    {/* Main Share Action */}
                    <button
                        onClick={handleShare}
                        className="skeuo-button-bold w-full h-20 rounded-[2rem] flex items-center justify-center gap-4 group transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-x-0 h-[200%] top-[-50%] bg-gradient-to-b from-transparent via-white/10 to-transparent rotate-45 transform transition-transform group-hover:translate-x-full duration-1000 -translate-x-full" />
                        
                        <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
                             <MaterialSymbol name="send" size={24} className="text-white transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                        <span className="text-sm font-black text-white uppercase tracking-[0.25em]">{t('INVITE WITH FRIENDS')}</span>
                    </button>
                    
                    <p className="text-[9px] text-center font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest pb-4">
                        Terms and conditions apply to all rewards
                    </p>
                </main>
            </div>

            <BottomNavigation items={navigationItems} onItemClick={handleNavigationClick} />
        </div>
    );
};
