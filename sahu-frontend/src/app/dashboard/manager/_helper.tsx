
function generateWeeklyProductivity(employeeSummary: any[]) {
    const today = dayjs();
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const day = today.subtract(6 - i, "day");
        return {
            day: day.format("ddd"),
            hours: Math.floor(Math.random() * 40) + 20, // Placeholder
        };
    });
    return weekDays;
}
