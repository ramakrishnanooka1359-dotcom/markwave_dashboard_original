import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

interface EmiRow {
    month: number;
    emi: number;
    interest: number;
    principal: number;
    balance: number;
    revenue: number;
    cpf: number;
    cgf: number;
    emiFromRevenue: number;
    emiFromLoanPool: number;
    cpfFromRevenue: number;
    cpfFromLoanPool: number;
    cgfFromRevenue: number;
    cgfFromLoanPool: number;
    loanPoolBalance: number;
    profit: number;
    loss: number;
    totalPayment: number;
    debitFromBalance: number;
    netCash: number;
}

interface YearlyRow {
    month: number;
    emi: number;
    revenue: number;
    cpf: number;
    cgf: number;
    profit: number;
    loss: number;
    principal: number;
    interest: number;
    balance: number;
    loanPoolBalance: number;
    totalPayment: number;
    debitFromBalance: number;
    netCash: number;
}

interface AcfRow {
    month: number;
    installment: number;
    cumulative: number;
}

interface EmiContextType {
    amount: number;
    setAmount: (val: number) => void;
    rate: number;
    setRate: (val: number) => void;
    months: number;
    setMonths: (val: number) => void;
    units: number;
    setUnits: (val: number) => void;
    cpfEnabled: boolean;
    setCpfEnabled: (val: boolean) => void;
    cgfEnabled: boolean;
    setCgfEnabled: (val: boolean) => void;
    schedule: EmiRow[];
    yearlySchedule: YearlyRow[];
    emi: number;
    totalPayment: number;
    totalInterest: number;
    totalRevenue: number;
    totalCpf: number;
    totalCgf: number;
    totalProfit: number;
    totalLoss: number;
    totalNetCash: number;
    totalAssetValue: number;
    simulateHerd: (tenure: number, unitCount: number) => number[];
    calculateAssetValueFromSimulation: (ages: number[], units: number) => number;
    acfUnits: number;
    setAcfUnits: (val: number) => void;
    acfTenureMonths: number;
    setAcfTenureMonths: (val: number) => void;
    acfProjectionYear: number;
    setAcfProjectionYear: (val: number) => void;
    acfMonthlyInstallment: number;
    acfTotalInvestment: number;
    acfTotalBenefit: number;
    acfCpfBenefit: number;
    acfSchedule: AcfRow[];
    formatCurrency: (val: number) => string;
}

const EmiContext = createContext<EmiContextType | undefined>(undefined);

export const useEmi = () => {
    const context = useContext(EmiContext);
    if (!context) {
        throw new Error('useEmi must be used within an EmiProvider');
    }
    return context;
};

// Constants
const CPF_PER_UNIT_YEARLY = 15000.0;
const MARKET_UNIT_VALUE = 350000.0;
const ACF_INSTALLMENT_11_MONTHS = 30000.0;
const ACF_INSTALLMENT_30_MONTHS = 10000.0;

export const EmiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- EMI Calculator State ---
    const [amount, setAmount] = useState(400000); // 4L default
    const [rate, setRate] = useState(18.0);
    const [months, setMonths] = useState(60);
    const [units, setUnits] = useState(1);
    const [cpfEnabled, setCpfEnabled] = useState(true);
    const [cgfEnabled, setCgfEnabled] = useState(true);

    // --- ACF State ---
    const [acfUnits, setAcfUnits] = useState(1);
    const [acfTenureMonths, setAcfTenureMonths] = useState(30); // 11 or 30
    const [acfProjectionYear, setAcfProjectionYear] = useState(1);

    // --- Simulation Results State ---
    const [schedule, setSchedule] = useState<EmiRow[]>([]);
    const [yearlySchedule, setYearlySchedule] = useState<YearlyRow[]>([]); // For yearly view

    // Derived Totals
    const [emi, setEmi] = useState(0);
    const [totalPayment, setTotalPayment] = useState(0);
    const [totalInterest, setTotalInterest] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalCpf, setTotalCpf] = useState(0);
    const [totalCgf, setTotalCgf] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [totalLoss, setTotalLoss] = useState(0);
    const [totalNetCash, setTotalNetCash] = useState(0);

    // Asset Values
    const [totalAssetValue, setTotalAssetValue] = useState(0);

    // --- Formatting ---
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
        }).format(value);
    };

    // --- Helpers from Flutter Logic ---

    // Asset Valuation Logic
    const getValuationForAge = (ageInMonths: number) => {
        if (ageInMonths <= 12) return 10000;  // 0-12m: Calf
        if (ageInMonths <= 18) return 25000;  // 13-18m: Growing
        if (ageInMonths <= 24) return 40000;  // 19-24m: Heifer
        if (ageInMonths <= 34) return 100000; // 25-34m: Mature
        if (ageInMonths <= 40) return 150000; // 35-40m: Prime
        return 175000;                       // 41+m: Peak/Proven
    };

    // CGF Cost Logic
    const getMonthlyCgfForCalfAge = (age: number) => {
        if (age <= 12) return 0; // 0-12 months free
        if (age <= 18) return 1000; // 13-18 months
        if (age <= 24) return 1400; // 19-24 months
        if (age <= 30) return 1800; // 25-30 months
        if (age <= 36) return 2500; // 31-36 months
        return 0;
    };

    // Revenue Logic
    const getRevenueForAdult = (month: number, revenueStartMonth: number) => {
        if (month < revenueStartMonth) return 0;
        const k = month - revenueStartMonth;
        const cyclePos = k % 12;
        if (cyclePos >= 0 && cyclePos <= 4) return 9000; // Peak
        if (cyclePos >= 5 && cyclePos <= 7) return 6000; // Mid
        return 0; // Dry
    };

    const getRevenueForCalf = (month: number, cycleBaseMonth: number) => {
        if (month < cycleBaseMonth) return 0;
        const k = month - cycleBaseMonth;
        const cyclePos = k % 12;
        if (cyclePos <= 1) return 0;
        if (cyclePos <= 6) return 9000;
        if (cyclePos <= 9) return 6000;
        return 0;
    };

    // Simulation Core
    // Generates the schedule array
    const simulateConfig = (pAmount: number, pRate: number, pMonths: number, pUnits: number, pCpf: boolean, pCgf: boolean) => {
        const principal = pAmount;
        const monthlyRate = pRate / 12 / 100;

        let emiLocal = 0;
        if (monthlyRate === 0) {
            emiLocal = principal / (pMonths > 0 ? pMonths : 1);
        } else {
            const powFactor = Math.pow(1 + monthlyRate, pMonths);
            emiLocal = (principal * monthlyRate * powFactor) / (powFactor - 1);
        }

        let balance = principal;
        const rows: EmiRow[] = [];

        // Capital Requirement Calculation
        const perUnitBase = 350000.0;
        const perUnitCpf = CPF_PER_UNIT_YEARLY;
        const requiredPerUnit = perUnitBase + (pCpf ? perUnitCpf : 0.0);
        const requiredCapital = requiredPerUnit * pUnits;

        // Excess loan amount becomes "Loan Pool" (Working Capital)
        let loanPool = principal > requiredCapital ? (principal - requiredCapital) : 0.0;

        // Simulation Parameters
        const orderMonthBuff1 = 1;
        const orderMonthBuff2 = 7;
        const revenueStartBuff1 = 3;
        const revenueStartBuff2 = 9;

        const calfRevenueStartMonths: number[] = [];
        const calfCpfStartMonths: number[] = [];
        const allBirthMonths: number[] = [];

        // Helper to track births
        const trackBirths = (firstBirthMonth: number) => {
            for (let bm = firstBirthMonth; bm <= pMonths; bm += 12) {
                allBirthMonths.push(bm);

                // CPF Start (Direct)
                const cpfStart = bm + 24;
                if (cpfStart <= pMonths) calfCpfStartMonths.push(cpfStart);

                // Revenue Start (Direct)
                const revStart = bm + 33;
                if (revStart <= pMonths) calfRevenueStartMonths.push(revStart);

                // Grand Births (Gen 2)
                const firstGrandBaby = bm + 36;
                if (firstGrandBaby <= pMonths) {
                    for (let gb = firstGrandBaby; gb <= pMonths; gb += 12) {
                        allBirthMonths.push(gb);
                    }
                }
            }
        };

        trackBirths(orderMonthBuff1);
        trackBirths(orderMonthBuff2);

        const monthlyCpfPerAnimal = CPF_PER_UNIT_YEARLY / 12;

        for (let m = 1; m <= pMonths; m++) {
            const interestForMonth = balance * monthlyRate;
            let principalForMonth = emiLocal - interestForMonth;

            if (m === pMonths) principalForMonth = balance; // Close loan
            if (principalForMonth < 0) principalForMonth = 0;

            balance -= principalForMonth;
            if (balance < 0.000001) balance = 0;

            // CGF
            let cgfPerUnit = 0;
            if (pCgf) {
                for (const birthMonth of allBirthMonths) {
                    if (m >= birthMonth) {
                        const currentAge = (m - birthMonth) + 1;
                        cgfPerUnit += getMonthlyCgfForCalfAge(currentAge);
                    }
                }
            }
            const cgf = cgfPerUnit * pUnits;

            // Revenue
            let revenuePerUnit = 0;
            revenuePerUnit += getRevenueForAdult(m, revenueStartBuff1);
            revenuePerUnit += getRevenueForAdult(m, revenueStartBuff2);

            for (const startMonth of calfRevenueStartMonths) {
                revenuePerUnit += getRevenueForCalf(m, startMonth);
            }
            const revenue = revenuePerUnit * pUnits;

            // CPF
            let cpf = 0;
            if (pCpf) {
                if (m > 12) {
                    // Adult CPFs
                    if (m >= orderMonthBuff1) cpf += monthlyCpfPerAnimal * pUnits;
                    if (m >= orderMonthBuff2 + 12) cpf += monthlyCpfPerAnimal * pUnits;

                    // Calf CPFs
                    for (const start of calfCpfStartMonths) {
                        if (m >= start) cpf += monthlyCpfPerAnimal * pUnits;
                    }
                }
            }

            // Payments Logic: Try to pay from Revenue -> Then Loan Pool -> Then Loss (Pocket)
            let emiFromRevenue = revenue >= emiLocal ? emiLocal : revenue;
            let remainingRevenue = revenue - emiFromRevenue;
            let emiFromLoanPool = 0;

            let remainingEmi = emiLocal - emiFromRevenue;
            if (remainingEmi > 0 && loanPool > 0) {
                const take = remainingEmi <= loanPool ? remainingEmi : loanPool;
                emiFromLoanPool = take;
                loanPool -= take;
                remainingEmi -= take;
            }

            let cpfFromRevenue = 0;
            let remainingCpf = cpf;
            if (remainingRevenue > 0 && remainingCpf > 0) {
                const take = remainingRevenue <= remainingCpf ? remainingRevenue : remainingCpf;
                cpfFromRevenue = take;
                remainingRevenue -= take;
                remainingCpf -= take;
            }

            let cpfFromLoanPool = 0;
            if (remainingCpf > 0 && loanPool > 0) {
                const take = remainingCpf <= loanPool ? remainingCpf : loanPool;
                cpfFromLoanPool = take;
                loanPool -= take;
                remainingCpf -= take;
            }

            let cgfFromRevenue = 0;
            let remainingCgf = cgf;
            if (remainingRevenue > 0 && remainingCgf > 0) {
                const take = remainingRevenue <= remainingCgf ? remainingRevenue : remainingCgf;
                cgfFromRevenue = take;
                remainingRevenue -= take;
                remainingCgf -= take;
            }

            let cgfFromLoanPool = 0;
            if (remainingCgf > 0 && loanPool > 0) {
                const take = remainingCgf <= loanPool ? remainingCgf : loanPool;
                cgfFromLoanPool = take;
                loanPool -= take;
                remainingCgf -= take;
            }

            let loss = remainingEmi + remainingCpf + remainingCgf;
            if (loss < 0) loss = 0;

            let profit = remainingRevenue;
            if (profit < 0) profit = 0;
            if (profit > 0) loanPool += profit;

            rows.push({
                month: m,
                emi: emiLocal,
                interest: interestForMonth,
                principal: principalForMonth,
                balance: balance,
                revenue,
                cpf,
                cgf,
                emiFromRevenue,
                emiFromLoanPool,
                cpfFromRevenue,
                cpfFromLoanPool,
                cgfFromRevenue,
                cgfFromLoanPool,
                loanPoolBalance: loanPool,
                profit,
                loss,
                // Add aliases for easier table matching
                totalPayment: emiLocal + cpf + cgf,
                debitFromBalance: emiFromLoanPool + cpfFromLoanPool + cgfFromLoanPool,
                netCash: profit - loss
            });
        }
        return { rows, emi: emiLocal };
    };

    // Herd Simulation for Asset Valuations
    const simulateHerd = (tenureMonths: number, unitCount: number) => {
        const orderMonthBuff1 = 1;
        const orderMonthBuff2 = 7;

        // Just return list of ages for offspring (for a SINGLE unit).
        const offspringAges: number[] = [];
        const trackOffspring = (startMonth: number) => {
            // Direct 
            for (let bm = startMonth; bm <= tenureMonths; bm += 12) {
                offspringAges.push((tenureMonths - bm) + 1); // Age in months at end

                // Grand
                const firstGrand = bm + 36;
                if (firstGrand <= tenureMonths) {
                    for (let gb = firstGrand; gb <= tenureMonths; gb += 12) {
                        offspringAges.push((tenureMonths - gb) + 1);
                    }
                }
            }
        }
        trackOffspring(orderMonthBuff1);
        trackOffspring(orderMonthBuff2);

        // We return the ages for a SINGLE unit now, to avoid massive array creation crash.
        // multi-unit scaling happens in calculateAssetValueFromSimulation
        return offspringAges;
    };

    const calculateAssetValueFromSimulation = (singleUnitOffspringAges: number[], pUnits: number) => {
        const adultValue = 60000 * 2 * pUnits;

        let singleUnitOffspringValue = 0;
        for (const age of singleUnitOffspringAges) {
            singleUnitOffspringValue += getValuationForAge(age);
        }

        // Total = Adults + (Single Unit Offspring Total * Unit Count)
        return adultValue + (singleUnitOffspringValue * pUnits);
    }

    // --- Effects to Update State ---
    useEffect(() => {
        const { rows, emi: calcEmi } = simulateConfig(amount, rate, months, units, cpfEnabled, cgfEnabled);

        setEmi(calcEmi);
        setSchedule(rows);

        // Calculate Totals
        const tRev = rows.reduce((acc, r) => acc + r.revenue, 0);
        const tCpf = rows.reduce((acc, r) => acc + r.cpf, 0);
        const tCgf = rows.reduce((acc, r) => acc + r.cgf, 0);
        const tProfit = rows.reduce((acc, r) => acc + r.profit, 0);
        const tLoss = rows.reduce((acc, r) => acc + r.loss, 0);

        // Net Cash is usually Profit - Loss
        setTotalRevenue(tRev);
        setTotalCpf(tCpf);
        setTotalCgf(tCgf);
        setTotalProfit(tProfit);
        setTotalLoss(tLoss);
        setTotalNetCash(tProfit - tLoss);

        // Derived financial totals
        // const tPrincip = rows.reduce((acc, r) => acc + r.principal, 0); // Should match amount roughly
        const tInt = rows.reduce((acc, r) => acc + r.interest, 0);

        setTotalPayment(calcEmi * months);
        setTotalInterest(tInt);

        // Asset Value
        const herdAges = simulateHerd(months, units);
        const assetVal = calculateAssetValueFromSimulation(herdAges, units);
        setTotalAssetValue(assetVal);

        // Yearly Schedule Generation
        const yearly: YearlyRow[] = [];
        const numYears = Math.ceil(months / 12);
        for (let i = 0; i < numYears; i++) {
            const start = i * 12;
            const end = Math.min((i + 1) * 12, rows.length);
            const chunk = rows.slice(start, end);

            const yEmi = chunk.reduce((s, r) => s + r.emi, 0);
            const yRev = chunk.reduce((s, r) => s + r.revenue, 0);
            const yCpf = chunk.reduce((s, r) => s + r.cpf, 0);
            const yCgf = chunk.reduce((s, r) => s + r.cgf, 0);
            const yProfit = chunk.reduce((s, r) => s + r.profit, 0);
            const yLoss = chunk.reduce((s, r) => s + r.loss, 0);
            const yPrincipal = chunk.reduce((s, r) => s + r.principal, 0);
            const yInterest = chunk.reduce((s, r) => s + r.interest, 0);
            const lastBalance = chunk[chunk.length - 1].balance;
            const lastLoanPool = chunk[chunk.length - 1].loanPoolBalance;

            yearly.push({
                month: i + 1, // Year number
                emi: yEmi,
                revenue: yRev,
                cpf: yCpf,
                cgf: yCgf,
                profit: yProfit,
                loss: yLoss,
                principal: yPrincipal,
                interest: yInterest,
                balance: lastBalance, // Balance at end of year
                loanPoolBalance: lastLoanPool,
                totalPayment: yEmi + yCpf + yCgf,
                debitFromBalance: chunk.reduce((s, r) => s + (r.emiFromLoanPool + r.cpfFromLoanPool + r.cgfFromLoanPool), 0),
                netCash: yProfit - yLoss
            });
        }
        setYearlySchedule(yearly);

    }, [amount, rate, months, units, cpfEnabled, cgfEnabled]);

    // --- ACF Derived Data ---
    const acfMonthlyInstallment = useMemo(() => {
        return acfTenureMonths === 11 ? ACF_INSTALLMENT_11_MONTHS : ACF_INSTALLMENT_30_MONTHS;
    }, [acfTenureMonths]);

    const acfTotalInvestment = useMemo(() => {
        return acfUnits * acfMonthlyInstallment * acfTenureMonths;
    }, [acfUnits, acfMonthlyInstallment, acfTenureMonths]);

    const acfCpfBenefit = useMemo(() => {
        // 11 Months: 1 buffalo free (multiplier 1)
        // 30 Months: 2 buffalo free (multiplier 2)
        const multiplier = acfTenureMonths === 11 ? 1 : 2;
        return acfUnits * CPF_PER_UNIT_YEARLY * multiplier;
    }, [acfUnits, acfTenureMonths]);

    const acfMarketAssetValue = acfUnits * MARKET_UNIT_VALUE;
    const acfTotalBenefit = (acfMarketAssetValue - acfTotalInvestment) + acfCpfBenefit;

    const acfScheduleTotal = useMemo(() => {
        const rows: AcfRow[] = [];
        let cumulative = 0;
        const monthly = acfUnits * acfMonthlyInstallment;
        for (let i = 1; i <= acfTenureMonths; i++) {
            cumulative += monthly;
            rows.push({
                month: i,
                installment: monthly,
                cumulative
            })
        }
        return rows;
    }, [acfUnits, acfMonthlyInstallment, acfTenureMonths]);

    return (
        <EmiContext.Provider value={{
            // EMI State
            amount, setAmount,
            rate, setRate,
            months, setMonths,
            units, setUnits,
            cpfEnabled, setCpfEnabled,
            cgfEnabled, setCgfEnabled,

            // EMI Results
            schedule, yearlySchedule,
            emi, totalPayment, totalInterest,
            totalRevenue, totalCpf, totalCgf,
            totalProfit, totalLoss, totalNetCash,
            totalAssetValue,
            simulateHerd, calculateAssetValueFromSimulation,

            // ACF State
            acfUnits, setAcfUnits,
            acfTenureMonths, setAcfTenureMonths,
            acfProjectionYear, setAcfProjectionYear,

            // ACF Results
            acfMonthlyInstallment,
            acfTotalInvestment,
            acfTotalBenefit,
            acfCpfBenefit,
            acfSchedule: acfScheduleTotal,

            // Utils
            formatCurrency
        }}>
            {children}
        </EmiContext.Provider>
    );
};
