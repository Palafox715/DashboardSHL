function getTodayTransfers(transfers) {

    const today =
        new Date().toDateString();

    return transfers.filter(transfer => {

        return new Date(
            transfer.timestamp
        ).toDateString() === today;

    });

}


function getWeekStart(date) {

    const result =
        new Date(date);


    const day =
        result.getDay();


    // Wednesday = 3
    const daysSinceWednesday =
        (day - 3 + 7) % 7;


    result.setDate(
        result.getDate() - daysSinceWednesday
    );


    result.setHours(0,0,0,0);


    return result;

}



function getCurrentWeekTransfers(transfers) {

    const start =
        getWeekStart(new Date());


    return transfers.filter(transfer => {

        return transfer.timestamp >= start.getTime();

    });

}


function countStatus(transfers, status) {

    return transfers.filter(
        transfer => transfer.status === status
    ).length;

}


// ---------- Bonus Engine ----------


const BONUS_RULES = {

    normal: {

        approved: {

            tier1Minimum: 3,
            tier1Rate: 4.70,

            tier2Minimum: 8,
            tier2Rate: 5.85

        },

        declined: {

            tier1Minimum: 3,
            tier1Rate: 1.75

        }

    },


    saturday: {

        approved: {

            tier1Minimum: 2,
            tier1Rate: 5.85

        },

        declined: {

            tier1Minimum: 3,
            tier1Rate: 1.75

        }

    }

};



function getBonusRules(date) {

    const day =
        new Date(date).getDay();


    const isSaturday =
        day === 6;


    return isSaturday
        ? BONUS_RULES.saturday
        : BONUS_RULES.normal;

}



function calculateApprovedBonus(count, rules) {

    if (count < rules.approved.tier1Minimum) {

        return 0;

    }


    if (
        rules.approved.tier2Minimum &&
        count >= rules.approved.tier2Minimum
    ) {

        return count * rules.approved.tier2Rate;

    }


    return count * rules.approved.tier1Rate;

}



function calculateDeclinedBonus(count, rules) {

    if (count < rules.declined.tier1Minimum) {

        return 0;

    }


    return count * rules.declined.tier1Rate;

}



function calculateDailyBonusBreakdown(
    approvedCount,
    declinedCount,
    date
) {

    const rules =
        getBonusRules(date);


    const approvedBonus =
        calculateApprovedBonus(
            approvedCount,
            rules
        );


    const declinedBonus =
        calculateDeclinedBonus(
            declinedCount,
            rules
        );


    return {

        approvedBonus: approvedBonus,

        declinedBonus: declinedBonus,

        totalBonus:
            approvedBonus + declinedBonus

    };

}


function calculateDailyBonus(
    approvedCount,
    declinedCount,
    date
) {

    return calculateDailyBonusBreakdown(
        approvedCount,
        declinedCount,
        date
    ).totalBonus;

}


function calculateWeeklyBonus(transfers) {

    const dailyTotals = {};


    transfers.forEach(transfer => {

        const dateKey =
            new Date(transfer.timestamp).toDateString();


        if (!dailyTotals[dateKey]) {

            dailyTotals[dateKey] = {

                date: new Date(transfer.timestamp),

                approved: 0,

                declined: 0

            };

        }


        if (transfer.status === "approved") {

            dailyTotals[dateKey].approved++;

        }
        else {

            dailyTotals[dateKey].declined++;

        }

    });


    return Object.values(dailyTotals)
        .reduce((total, day) => {

            return total + calculateDailyBonus(

                day.approved,

                day.declined,

                day.date

            );

        }, 0);

}

function groupTransfersByWeek(transfers) {

    const weeks = {};


    transfers.forEach(transfer => {

        const date =
            new Date(transfer.timestamp);


        const weekStart =
            getWeekStart(date);


        const weekKey =
            weekStart.toDateString();


        if (!weeks[weekKey]) {

            const weekEnd =
                new Date(weekStart);


            weekEnd.setDate(
                weekStart.getDate() + 6
            );


            weekEnd.setHours(
                23,
                59,
                59,
                999
            );


            weeks[weekKey] = {

                weekStart: weekStart,

                weekEnd: weekEnd,

                transfers: []

            };

        }


        weeks[weekKey].transfers.push(
            transfer
        );

    });


    return Object.values(weeks)
        .sort((a, b) => {

            return b.weekStart - a.weekStart;

        });
}


function createPayrollWeekData(transfers) {

    const weeks =
        groupTransfersByWeek(transfers);


    return weeks.map(week => {

        const dailyData = {};


        week.transfers.forEach(transfer => {

            const date =
                new Date(transfer.timestamp);


            const dateKey =
                date.toDateString();


            if (!dailyData[dateKey]) {

                dailyData[dateKey] = {

                    date: new Date(date),

                    transfers: [],

                    approvedCount: 0,

                    declinedCount: 0

                };

            }


            dailyData[dateKey].transfers.push(
                transfer
            );


            if (transfer.status === "approved") {

                dailyData[dateKey].approvedCount++;

            }
            else {

                dailyData[dateKey].declinedCount++;

            }

        });


        const days =
            Object.values(dailyData)
                .sort((a, b) => {

                    return a.date - b.date;

                })
                .map(day => {

                    const bonus =
                    calculateDailyBonusBreakdown(
                        day.approvedCount,
                        day.declinedCount,
                        day.date
                    );
                
                
                    return {
                    
                        date: day.date,
                    
                        transfers: day.transfers,
                    
                        transferCount:
                            day.transfers.length,
                    
                        approvedCount:
                            day.approvedCount,
                    
                        declinedCount:
                            day.declinedCount,
                    
                        approvedBonus:
                            bonus.approvedBonus,
                    
                        declinedBonus:
                            bonus.declinedBonus,
                    
                        dailyBonus:
                            bonus.totalBonus
                    
                    };

                });


                const weeklyApprovedBonus =
            days.reduce(
                (total, day) => {
        
                    return total + day.approvedBonus;
        
                },
                0
            );
        
        
                const weeklyDeclinedBonus =
                    days.reduce(
                        (total, day) => {
                
                            return total + day.declinedBonus;
                
                        },
                        0
                    );
                
                
                const weeklyBonus =
                    days.reduce(
                        (total, day) => {
                
                            return total + day.dailyBonus;
                
                        },
                        0
                    );


        return {

            weekStart: week.weekStart,

            weekEnd: week.weekEnd,

            days: days,

            transferCount:
                week.transfers.length,

            weeklyApproved:
                week.transfers.filter(
                    transfer =>
                        transfer.status === "approved"
                ).length,

            weeklyDeclined:
                week.transfers.filter(
                    transfer =>
                        transfer.status === "declined"
                ).length,

            weeklyApprovedBonus:
                weeklyApprovedBonus,
            
                weeklyDeclinedBonus:
                    weeklyDeclinedBonus,
                
                weeklyBonus:
                    weeklyBonus

        };

    });
}






function createHistoryData(transfers) {

    const dailyHistory = {};


    transfers.forEach(transfer => {

        const dateKey =
            new Date(
                transfer.timestamp
            ).toDateString();


        if (!dailyHistory[dateKey]) {

            dailyHistory[dateKey] = {

                date: new Date(
                    transfer.timestamp
                ),

                transfers: [],

                approvedCount: 0,

                declinedCount: 0

            };

        }


        dailyHistory[dateKey].transfers.push(
            transfer
        );


        if (transfer.status === "approved") {

            dailyHistory[dateKey].approvedCount++;

        }
        else {

            dailyHistory[dateKey].declinedCount++;

        }

    });


    return Object.values(dailyHistory)

        .sort((a,b) => {

            return a.date - b.date;

        })

        .map(day => {

           const bonus =
                calculateDailyBonusBreakdown(
                    day.approvedCount,
                    day.declinedCount,
                    day.date
                );
            
            
                return {
                
                    date: day.date,
                
                    transfers: day.transfers,
                
                    transferCount:
                        day.transfers.length,
                
                    approvedCount:
                        day.approvedCount,
                
                    declinedCount:
                        day.declinedCount,
                
                    approvedBonus:
                        bonus.approvedBonus,
                
                    declinedBonus:
                        bonus.declinedBonus,
                
                    dailyBonus:
                        bonus.totalBonus
                
                };

        });

}





async function updateDashboard() {

    const transfers =
        await getTransfers();


    const today =
        getTodayTransfers(transfers);


    const week =
        getCurrentWeekTransfers(transfers);


    document.getElementById("todayApproved").textContent =
        countStatus(today, "approved");


    document.getElementById("todayDeclined").textContent =
        countStatus(today, "declined");


    document.getElementById("weekApproved").textContent =
        countStatus(week, "approved");


    document.getElementById("weekDeclined").textContent =
        countStatus(week, "declined");


        const todayApproved =
        countStatus(today, "approved");


    const todayDeclined =
        countStatus(today, "declined");


    const todayBonus =
    calculateDailyBonus(
        todayApproved,
        todayDeclined,
        new Date()
    );

    document.querySelector(".today-bonus").textContent =
    "$" + todayBonus.toFixed(2);
    
    const weekBonus =
    calculateWeeklyBonus(week);


    document.getElementById("weekBonus").textContent =
        "$" + weekBonus.toFixed(2);

}








