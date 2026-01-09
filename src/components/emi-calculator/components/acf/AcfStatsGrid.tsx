import React from 'react';
import { useEmi } from '../../context/EmiContext';
import { Wallet, Calendar, PiggyBank, Briefcase } from 'lucide-react';
import { clsx } from 'clsx';
import HoverGradientStatCard from '../stats/HoverGradientStatCard';
import AssetProjectionCard from './AssetProjectionCard';

const AcfStatsGrid = () => {
    const {
        acfTotalInvestment,
        acfTenureMonths,
        acfUnits,
        acfTotalBenefit,
        acfCpfBenefit,
        simulateHerd,
        calculateAssetValueFromSimulation,
        acfProjectionYear,
        setAcfProjectionYear,
        formatCurrency
    } = useEmi();

    // Projection Logic for Card
    const tenureForChecking = acfProjectionYear * 12;
    const offspringAges = simulateHerd(tenureForChecking, acfUnits);
    const projectedAssetValue = calculateAssetValueFromSimulation(offspringAges, acfUnits);
    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <HoverGradientStatCard
                label="Total Investment"
                value={acfTotalInvestment}
                prefix="₹"
                icon={Wallet}
                color="blue" // Indigo-ish in Flutter
                secondaryText={`${acfTenureMonths} months`}
                formatCurrency={formatCurrency}
            />

            <AssetProjectionCard
                value={projectedAssetValue}
                year={acfProjectionYear}
                onYearChange={setAcfProjectionYear}
                buffaloCount={(acfUnits * 2) + (offspringAges.length * acfUnits)}
                formatCurrency={formatCurrency}
            />

            <HoverGradientStatCard
                label="Total Savings"
                value={acfTotalBenefit}
                prefix="₹"
                icon="/buffalo_icon.png"
                color="green" // Emerald
                secondaryText={`₹${formatCurrency(acfTotalBenefit - acfCpfBenefit)} Interest + ₹${formatCurrency(acfCpfBenefit)} Free CPF`}
                formatCurrency={formatCurrency}
            />

            <HoverGradientStatCard
                label="Period"
                value={acfTenureMonths}
                prefix=""
                icon={Calendar}
                color="blue" // Amber in Flutter actually
                secondaryText="Months Tenure"
                formatCurrency={formatCurrency}
            />
        </div>
    );
};

export default AcfStatsGrid;
