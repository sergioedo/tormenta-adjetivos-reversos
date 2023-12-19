import fetch from 'node-fetch';
import fs, { stat } from 'fs';
import os from 'os'

const apiUrl = 'http://localhost:3000';

const frequencies = {}
let samplesCount = 0

const updateFrequencies = (data) => {
    data.map(word => {
        // frequencies[word] = ((frequencies[word] || 0) + 1) / samplesCount
        frequencies[word] = {
            values: frequencies[word]?.lastSample ? [...frequencies[word].values, samplesCount - frequencies[word].lastSample] : [],
            lastSample: samplesCount
        }
    })
}

const fetchData = async () => {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        samplesCount += 1
        updateFrequencies(data)
        // console.log(samplesCount)
    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

// const normFactor = 8.3 // v1
const normFactor = 8.5 // v2
// const normFactor = 1.0

const saveStatistics = async () => {
    const statistics = Object.keys(frequencies).reduce((acc, word) => {
        const sumFreq = frequencies[word].values.reduce((count, freq) => count + freq, 0)
        return {
            ...acc,
            [word]: sumFreq ? (1 / (sumFreq / frequencies[word].values.length)) * normFactor : 0
        }
    }, {})
    fs.writeFileSync('statistics.json', JSON.stringify({
        // frequencies,
        statistics,
        metadata: {
            // distinctValues: Object.keys(frequencies).length,
            // frequenciesSum: Object.values(frequencies).reduce((count, value) => count + value, 0),
            distinctValues: Object.keys(statistics).length,
            statisticsSum: Object.values(statistics).reduce((count, value) => count + value, 0),
            samplesCount
        }
    }, null, 4), { encoding: 'utf-8' })
    const sortedWords = Object.keys(statistics).map(word => ({ word, frequency: statistics[word] })).sort((a, b) => b.frequency - a.frequency)
    fs.writeFileSync('words.csv', sortedWords.map(w => `${w.word},${w.frequency.toFixed(4)}`).join(os.EOL), { encoding: 'utf-8' })
}

// fetchData()
// setInterval(fetchData, 50);
setInterval(saveStatistics, 1000);

while (true) {
    await fetchData()
}
