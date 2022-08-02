export const addressesToExclude = [
    'dDyaDsYuiyzDxHXfiyA29y25rnkyrcXYBtyn6XExNCKTEuR3G',
    'dDyJpjdb1GdkLw3JuvrCanknRxG6c5kUnbkAT3LqXgitDMxNz',
    'dE2n9aqDXfhEiQ9kT6qJShRypQL4cJATN15vHUcJzQu9K3PbP',
    'dE1bnxoBzJJBD385ax5Bac1tCheY336pm3FLbvNiv6oUZNbsB',
    'dE2nBPHkwEYmJikgEW8TmZWCYcdpqkd8QgH354Udq5ZJ7QKh8',
    'dE4R6Qhh4mccAa4F7DYkya6TpqMEPZeX8GT2AKTquyo8PdWak',
];

// support multi networks
export type NetworkType = 'zeitgeist';

export const networks = {
    zeitgeist: {
        name: 'zeitgeist',
        // Endpoints
        // 1. wss://rpc-0.zeitgeist.pm
        // 2. wss://zeitgeist-rpc.dwellir.com
        // 3. wss://zeitgeist.api.onfinality.io/public-ws
        endpoints: [
            'wss://zeitgeist-rpc.dwellir.com',
            'wss://zeitgeist.api.onfinality.io/public-ws',
            'wss://rpc-0.zeitgeist.pm',
        ],
        subscanUrl: 'https://zeitgeist.api.subscan.io',
    },
};
