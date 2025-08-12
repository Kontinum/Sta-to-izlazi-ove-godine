import { publishers } from './izdavaci.js';
import { publishersLatin } from './izdavaciKvacice.js';

const searchButton = document.getElementById('search');
let publisher = document.getElementById('publisher');
const results = document.getElementById('results');
const mainText = document.querySelector('.main-text');
const publishersList = document.getElementById('publishersList');
const resultsCountNum = document.querySelector('.resultsCountNum');
const resultsCountEl = document.querySelector('.resultsCount');
const DomParser = new DOMParser();
const searchErrorMessage = 'Došlo je do greške prilikom pretrage. Molimo pokušajte ponovo kasnije.'
const textForMain = `Unesi izdavaca i saznaj sta izlazi ${new Date().getFullYear()} godine :)`;
const corsProxy = 'https://api.codetabs.com/v1/proxy?quest=';
const cobbisUrl = 'https://plus.cobiss.net/cobiss/sr/sr';
const searchResults = document.getElementById('searchResults');
const year = document.getElementById('year');
const type = document.getElementById('type');
let pdFrom = '01.01.2025'; // Default value for pdfrom
let pdTo = '31.12.2025'; // Default value for pdto
let typeCC = '';
mainText.textContent = textForMain;

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

const getCurrentAndLastTwoYears = () => {
    const currentYear = new Date().getFullYear();
    const lastTwoYears = [currentYear - 1, currentYear - 2];
    const years = [currentYear, ...lastTwoYears].sort((a, b) => b - a);
    return years;
}

const populateYearOptions = () => {
    const years = getCurrentAndLastTwoYears();
    years.forEach(yearVal => {
        const option = document.createElement('option');
        option.value = yearVal;
        option.textContent = yearVal;
        year.appendChild(option);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    populatePublishersList(publishers);
    populateYearOptions();
});

// To avoid Cors proxy issues with URI encoding, we normalize the publisher name.
const normalizePublisherName = (publisherName) => {
    try {
        publisherName = publisherName.replace(/\s+/g, '+');
        publisherName = formatUnicode(publisherName);

        return publisherName;
    } catch (error) {
        throw new Error(searchErrorMessage);
    }
}

const formatUnicode = (str) => {
    const publisherName = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐžŽćĆčČšŠ]/g, c => {
            const map = { 'đ': 'd', 'Đ': 'D', 'ž': 'z', 'Ž': 'Z', 'ć': 'c', 'Ć': 'C', 'č': 'c', 'Č': 'C', 'š': 's', 'Š': 'S' };
            return map[c] || c;
        });

    return publisherName;
}

const containsLatinCharacters = (str) => {
    return /[đĐžŽšŠćĆčČ]/.test(str);
}

let resultsCount = 0;

const searchForData = async (publisherName, offset) => {
    try {
        const publisher = normalizePublisherName(publisherName);
        const targetUrl = `${cobbisUrl}/bib/search/advanced?ax&ti&pu=${publisher}&db=cobib&mat=allmaterials&max=100&sort=ti&cc=${typeCC}&pdfrom=${pdFrom}&pdto=${pdTo}&start=${offset}`;
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
        console.log(doc);

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
        } else {
            alert('Molimo unesite ime izdavača.');
        }
    }
    catch (error) {
        alert(error.message);
    }
}

const searchPublishers = (e) => {
    if (e.target.value.length >= 2) {
        const searchValue = e.target.value.trim();        
        publishersList.innerHTML = '';

        const searchSource = containsLatinCharacters(searchValue) ? publishersLatin : publishers;

        const searchPublishers = searchSource.filter((publisher) => {            
            return publisher.toLowerCase().includes(searchValue.toLowerCase());
        })

        populatePublishersList(searchPublishers);
    } else {
        publishersList.innerHTML = '';
        populatePublishersList(publishers);
    }
}

const populatePublishersList = (publishers) => {
    publishers.forEach((publisherName) => {
        const span = document.createElement('span');
        span.className = 'border-1 border-blue-200 p-1 cursor-pointer hover:bg-blue-100';
        span.textContent = publisherName;
        span.addEventListener('click', (e) => {
            publisher.value = e.target.textContent; // Set the input value to the clicked publisher
        });
        publishersList.appendChild(span);
    });
}

const resetAndRunSearch = (e) => {
    resultsCount = 0; // Reset results count on new search
    searchResults.value = ''; // Clear search results input
    search(e);
}

publisher.addEventListener('change', (e) => {
    //search(e); // Reset results count on new search
});
publisher.addEventListener('input', searchPublishers)
searchButton.addEventListener('click', (e) => {
    resetAndRunSearch(e);
});
publisher.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        resetAndRunSearch(e);
    }
});