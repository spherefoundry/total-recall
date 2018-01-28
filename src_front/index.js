import Scanner from './scanner';
import 'whatwg-fetch';

class App {
    constructor() {
        this.onProductFound = this.onProductFound.bind(this);
        this.onResultsExit = this.onResultsExit.bind(this);

        this.scannerPage = new ScannerPage(this.onProductFound);
        this.resultsPage = new ResultsPage(this.onResultsExit);

        this.currentPage = null;
    }

    start() {
        this.setPage(this.scannerPage);
    }

    setPage(page) {
        if (this.currentPage != null) {
            this.currentPage.uninstall();
            this.currentPage = null;
        }

        if (page != null) {
            this.currentPage = page;
            page.install();
        }
    }

    onProductFound(productJSON) {
        this.resultsPage.setProduct(productJSON);
        this.setPage(this.resultsPage);
    }

    onResultsExit() {
        this.setPage(this.scannerPage);
    }
}

class AppPage {
    constructor() {
        
    }

    install() {
        
    }

    uninstall() {
        
    }
}

class ScannerPage extends AppPage {
    constructor(onProductFoundCallback) {
        super();
        this.onDetected = this.onDetected.bind(this);
        this.blackList = [];
        this.onProductFoundCallback = onProductFoundCallback;

        this.scanner = new Scanner(this.onDetected);
    }

    install() {
        $('#scanner-page').removeClass('hidden');
        this.scanner.start();
    }

    uninstall() {
        $('#scanner-page').addClass('hidden');
        this.scanner.stop();
    }

    async onDetected(code) {
        if (this.blackList.includes(code)) {
            console.log(`blacklisted: ${code}`);
            return;
        }

        let response = await fetch(`/api/product/${code}`);
        if (response.status == 404) {
            this.blackList.push(code);
            return;
        }

        try {
            let responseJSON = await response.json();
            this.onProductFoundCallback(responseJSON);
        } catch (err) {
            console.log('parsing failed', err);
        }
    }
}

class ResultsPage extends AppPage {
    constructor(onCloseCallback) {
        super();

        this.onCloseClicked = this.onCloseClicked.bind(this);
        this.onCloseCallback = onCloseCallback;

        this.product = null;

        $('#results-page-back-button').click(this.onCloseClicked);
    }

    setProduct(product) {
        this.product = product;
        console.log(product);

        $('#results-page-product-name').children().remove();
        $('#results-page-product-name').text(product.content.data.name);
        $('#results-page-product-images').children().remove();
        for (const image of product.content.data.images) {
            let newElement = $('<img/>').attr('src', image.medium);
            $('#results-page-product-images').append(newElement);
        }
        
        $('#results-page-nutrition-facts-table').children().remove();
        for (const nutrient of Object.values(product.content.data.nutrients)) {
            let newElement = $(`<div class='row'><div class='key'>${nutrient.name_translations['en']}</div><div class='value'>${nutrient.per_hundred} ${nutrient.unit}</div></div>`);
            $('#results-page-nutrition-facts-table').append(newElement);
        }

        let recalled = false;
        for (const event of product.events) {
            if (event.content.data.type == 'recall') {
                recalled = true;
            }
        }

        if (recalled) {
            $('#results-page-product-recall').removeClass('hidden');
            $('#results-page-product-no-recall').addClass('hidden');
        } else {
            $('#results-page-product-recall').addClass('hidden');
            $('#results-page-product-no-recall').removeClass('hidden');
        }
    }

    install() {
        $('#results-page').removeClass('hidden');
    }

    uninstall() {
        $('#results-page').addClass('hidden');
    }

    onCloseClicked() {
        this.onCloseCallback();
    }
}

$(function () {
    let app = new App();
    app.start();
    // app.scannerPage.onDetected('22125880');
});