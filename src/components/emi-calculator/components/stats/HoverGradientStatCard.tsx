import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp } from 'lucide-react';

interface HoverGradientStatCardProps {
    label: string;
    value: number | string;
    prefix?: string;
    icon: any;
    color?: 'blue' | 'green' | 'teal';
    secondaryText?: string;
    isSecondaryBold?: boolean;
    isLarge?: boolean;
    formatCurrency?: (val: number) => string;
}

const HoverGradientStatCard: React.FC<HoverGradientStatCardProps> = ({
    label,
    value,
    prefix = '',
    icon: Icon,
    color = 'blue',
    secondaryText,
    isLarge = false,
    formatCurrency
}) => {
    const colorStyles = {
        blue: {
            bg: 'bg-[#e3f2fd]',
            border: 'border-[#bbdefb]',
            text: 'text-[#1976d2]',
            iconBg: 'bg-[#bbdefb]',
        },
        green: {
            bg: 'bg-[#e8f5e9]',
            border: 'border-[#c8e6c9]',
            text: 'text-[#2e7d32]',
            iconBg: 'bg-[#c8e6c9]',
        },
        teal: {
            bg: 'bg-[#e0f2f1]',
            border: 'border-[#b2dfdb]',
            text: 'text-[#00796b]',
            iconBg: 'bg-[#b2dfdb]',
        },
    };

    const theme = colorStyles[color] || colorStyles.blue;

    if (isLarge) {
        return (
            <div className={clsx(
                "group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:shadow-md p-5 flex flex-col justify-between",
                theme.bg, theme.border
            )}>
                <div className="flex justify-between items-start">
                    {/* Top Left: Icon Pill */}
                    <div className={clsx("p-3 rounded-2xl flex items-center justify-center", theme.iconBg)}>
                        {typeof Icon === 'string' ? (
                            <img src={Icon} alt="icon" className="w-8 h-8 object-contain" />
                        ) : Icon ? (
                            <Icon className={clsx("w-8 h-8", theme.text)} />
                        ) : (
                            <TrendingUp className={clsx("w-8 h-8", theme.text)} />
                        )}
                    </div>

                    {/* Top Right: Data Stack */}
                    <div className="flex flex-col items-end text-right">
                        <p className="text-xs sm:text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-1 leading-none">
                            {label}
                        </p>
                        <div className={clsx("font-black text-xl sm:text-3xl", theme.text)}>
                            {prefix}{typeof value === 'number' && formatCurrency ? formatCurrency(value) : value}
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Aligned ROI Layout */}
                {secondaryText && (
                    <div className="flex justify-between items-baseline mt-4 w-full">
                        <div className="w-24 flex justify-start pl-2">
                            <span className="text-[10px] sm:text-[12px] font-black text-gray-900 leading-tight">
                                Rate of<br />Investment
                            </span>
                        </div>
                        <span className={clsx("text-lg sm:text-2xl font-black", theme.text)}>
                            ~ {secondaryText}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={clsx(
            "group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:shadow-md p-5 h-full flex flex-col",
            theme.bg, theme.border
        )}>
            <div className="flex items-start justify-start mb-4">
                <div className={clsx("p-3 rounded-2xl w-fit", theme.iconBg)}>
                    {typeof Icon === 'string' ? (
                        <img src={Icon} alt="icon" className="w-6 h-6 object-contain" />
                    ) : Icon ? (
                        <Icon className={clsx("w-6 h-6", theme.text)} />
                    ) : (
                        <TrendingUp className={clsx("w-6 h-6", theme.text)} />
                    )}
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-end">
                <p className="font-bold text-gray-500 mb-1 text-[11px] uppercase tracking-wider">
                    {label}
                </p>
                <div className="flex items-baseline">
                    <span className={clsx("font-black text-lg sm:text-2xl", theme.text)}>
                        {prefix}{typeof value === 'number' && formatCurrency ? formatCurrency(value) : value}
                    </span>
                </div>
                {secondaryText && (
                    <div className="flex items-baseline mt-1 space-x-1">
                        <span className={clsx("font-black text-sm", theme.text)}>~ {secondaryText}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HoverGradientStatCard;

