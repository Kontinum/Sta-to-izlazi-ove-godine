import { publishers } from './publishers/publishers.js';
import { publishersLatin } from './publishers/publishers_utf_8.js';
import { corsProxy, cobbisUrl, searchErrorMessage, textForMain } from './config.js';
import { getUrl, normalizePublisherName, searchPublishers, populatePublishersList, populateYearOptions } from './helpers.js';

const searchButton = document.getElementById('search');
let publisher = document.getElementById('publisher');
const results = document.getElementById('results');
const mainText = document.querySelector('.main-text');
const publishersList = document.getElementById('publishersList');
const resultsCountNum = document.querySelector('.resultsCountNum');
const resultsCountEl = document.querySelector('.resultsCount');
const DomParser = new DOMParser();
const searchResults = document.getElementById('searchResults');
const year = document.getElementById('year');
const type = document.getElementById('type');
const spinner = document.querySelector('.spinner');
let pdFrom = '01.01.2025'; // Default value for pdfrom
let pdTo = '31.12.2025'; // Default value for pdto
let typeCC = '';
mainText.textContent = textForMain;

let resultsCount = 0;

const searchForData = async (publisherName, offset) => {
    try {
        const publisher = normalizePublisherName(publisherName);
        const targetUrl = getUrl(publisher, typeCC, pdFrom, pdTo, offset);
        const searchData = await fetch(corsProxy + encodeURIComponent(targetUrl));
        
        if (searchData.ok) {
            return await searchData.text();
        } else {
            throw new Error(searchErrorMessage);
        }
    }
    catch (error) {
        throw (error);
    }
};

const parseResultsBody = (searchData) => {
    try {
        const doc = DomParser.parseFromString(searchData, 'text/html');

        return doc.getElementById('resultBodyList');
    }
    catch (error) {
        throw new Error(searchErrorMessage);
    }
}

const displayResultsCount = () => {
    resultsCountEl.classList.remove('hidden');
    resultsCountNum.textContent = resultsCount;
}

const showResults = (searchBody) => {
    try {
        for (const result of searchBody.children) {
            resultsCount++;
            displayResultsCount();

            
            const resultHref =  `${cobbisUrl}/${result.dataset.href}`;            
            const title = result.dataset.title;
            const titleDiv = document.createElement('div');
            titleDiv.className = 'flex w-full p-3 mb-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 hover:underline';
            titleDiv.textContent = title + ' ↗';
            const link = document.createElement('a');
            link.href = resultHref;
            link.target = '_blank';
            link.appendChild(titleDiv);            
            results.insertAdjacentHTML('beforeend', link.outerHTML);
        }
    }
    catch (error) {
        throw new Error(searchErrorMessage);
    }
};

const search = async (e, currentOffset = 0) => {
    try {
        publishersLatin.innerHTML = '';
        if (publisher.value.length > 0) {
            spinner.classList.remove('hidden'); // Show spinner while fetching data
            if (currentOffset === 0) {
                results.innerHTML = '';
            }

            const searchData = await searchForData(publisher.value, currentOffset);
            const searchBody = parseResultsBody(searchData);            

            if (searchBody.children.length === 0 && currentOffset === 0) {
                resultsCountEl.classList.add('hidden');
                alert('Nema rezultata za traženog izdavača.');
                return;
            } else if (searchBody.children.length > 0) {
                searchResults.classList.remove('hidden');
                showResults(searchBody);
                // Recursively call if there are still results

                await search(e, currentOffset + 100);
            }
            spinner.classList.add('hidden'); // Hide spinner after fetching data
        } else {
            alert('Molimo unesite ime izdavača.');
        }
    }
    catch (error) {
        alert(error.message);
    }
}

const resetAndRunSearch = (e) => {
    resultsCount = 0; // Reset results count on new search
    searchResults.value = ''; // Clear search results input
    search(e);
}

const registerEvents = () => {
    publisher.addEventListener('input', (e) => {
        searchPublishers(e, publishersList, publishers, publishersLatin, publisher);
    });
    searchButton.addEventListener('click', (e) => {
        resetAndRunSearch(e);
    });
    publisher.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            resetAndRunSearch(e);
        }
    });
    year.addEventListener('change', (e) => {
        const selectedYear = e.target.value;
        pdFrom = `01.01.${selectedYear}`;
        pdTo = `31.12.${selectedYear}`;
    })

    type.addEventListener('change', (e) => {
        typeCC = e.target.value;
    })

    // Search through results
    searchResults.addEventListener('input', (e) => {
        const searchValue = e.target.value.toLowerCase();
        const resultElements = results.querySelectorAll('a');

        resultElements.forEach(element => {
            const title = element.textContent.toLowerCase();
            if (title.includes(searchValue)) {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        });
    });
}

const init = () => {
    populatePublishersList(publishers);
    populateYearOptions(year);
    registerEvents();
}

window.addEventListener('DOMContentLoaded', init);