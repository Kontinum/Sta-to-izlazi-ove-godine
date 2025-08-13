import { cobbisUrl, searchErrorMessage } from "./config.js"

export const getUrl = (publisher, typeCC, pdFrom, pdTo, offset) => {
    return `${cobbisUrl}/bib/search/advanced?ax&ti&pu=${publisher}&db=cobib&mat=allmaterials&max=100&sort=ti&cc=${typeCC}&pdfrom=${pdFrom}&pdto=${pdTo}&start=${offset}`
}

// To avoid Cors proxy issues with URI encoding, we normalize the publisher name.
export const normalizePublisherName = (publisherName) => {
    try {
        publisherName = publisherName.replace(/\s+/g, '+');
        publisherName = formatUnicode(publisherName);

        return publisherName;
    } catch (error) {
        throw new Error(searchErrorMessage);
    }
}

export const searchPublishers = (e, publishersList, publishers, publishersLatin, publisher) => {
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

export const populatePublishersList = (publishers) => {
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

const getCurrentAndLastTwoYears = () => {
    const currentYear = new Date().getFullYear();
    const lastTwoYears = [currentYear - 1, currentYear - 2];
    const years = [currentYear, ...lastTwoYears].sort((a, b) => b - a);
    return years;
}

export const populateYearOptions = (year) => {
    const years = getCurrentAndLastTwoYears();
    years.forEach(yearVal => {
        const option = document.createElement('option');
        option.value = yearVal;
        option.textContent = yearVal;
        year.appendChild(option);
    });
}

const containsLatinCharacters = (str) => {
    return /[đĐžŽšŠćĆčČ]/.test(str);
}

const formatUnicode = (str) => {
    const publisherName = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐžŽćĆčČšŠ]/g, c => {
            const map = { 'đ': 'd', 'Đ': 'D', 'ž': 'z', 'Ž': 'Z', 'ć': 'c', 'Ć': 'C', 'č': 'c', 'Č': 'C', 'š': 's', 'Š': 'S' };
            return map[c] || c;
        });

    return publisherName;
}
