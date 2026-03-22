/* ------------dedicated JS for creating light usage statistic charts----------------- */

function createLightDurationChart(roomName, roomLightUsageData) {
    //draws horizontal bar graph of the total lights duration for the particular room
    const dateValues = []; const totalDurationValues = [];
    for (datarow of roomLightUsageData) {
        dateValues.push(datarow["date"]);
        //convert duration in "hh:mm:ss" to hours float 
        const [hours, minutes, seconds] = datarow["totalDuration"].split(':').map(Number);
		const totalHours = hours + (minutes / 60) + (seconds / 3600);
        totalDurationValues.push(totalHours);
    }

    const chartCanvas = $(`<canvas class="statChart" id="${roomName}_durationChart"></canvas>`);
    $("#lightUsageStatsChart").append(chartCanvas);

    new Chart(chartCanvas, {
        type: "bar",
        data: {
            labels: dateValues,
            datasets: [{data: totalDurationValues}]
        },
        options: {
            responsive:true, maintainAspectRatio: false, indexAxis:'y',
            scales: {
                x: {beginAtZero: false, min: Math.min(...totalDurationValues)-0.5, max: Math.max(...totalDurationValues+0.5)}
            },
            plugins: {
                legend: {display: false},
                title: {
                    display: true,
                    text: `Total light duration in ${roomName} (hours)`,
                    font: {size: 16}
                }
            }
        }
    });
}

function createLightKwhChart(roomName, roomLightUsageData) {
    //draws vertical bar graph of the total kwh consumption for the particular room
    const dateValues = []; const totalKwhValues = [];
    for (datarow of roomLightUsageData) {
        dateValues.push(datarow["date"]);
        totalKwhValues.push(datarow["totalKwh"]);
    }

    const chartCanvas = $(`<canvas class="statChart" id="${roomName}_kwhChart"></canvas>`);
    $("#lightUsageStatsChart").append(chartCanvas);

    new Chart(chartCanvas, {
        type: "bar",
        data: {
            labels: dateValues,
            datasets: [{data: totalKwhValues}]
        },
        options: {
            responsive:true, maintainAspectRatio: false,
            scales: {
                y: {beginAtZero: false, min: Math.min(...totalKwhValues)-5, max: Math.max(...totalKwhValues+5)}
            },
            plugins: {
                legend: {display: false},
                title: {
                    display: true,
                    text: `Total power consumption in ${roomName} (kWh)`,
                    font: {size: 16}
                }
            }
        }
    });
}