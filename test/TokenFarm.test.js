const DaiToken = artifacts.require("DaiToken");
const DappToken = artifacts.require("DappToken");
const TokenFarm = artifacts.require("TokenFarm");

require("chai")
    .use(require("chai-as-promised"))
    .should();

function tokens(n) {
    return web3.utils.toWei(n, 'ether');
}

contract('TokenFarm', ([owner, investor]) => {
    let daiToken, dappToken, tokenFarm;

    before(async () => {
        daiToken = await DaiToken.new();
        dappToken = await DappToken.new();
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        // Transfer all tokens to TokenFarm (1 million)
        await dappToken.transfer(tokenFarm.address, tokens('1000000'));

        // Transfer 100 Mock DAI tokens to investor
        await daiToken.transfer(investor, tokens('100'), {from: owner});
    });

    describe('Mock DAI Deployment', async () => {
        it('has a name', async () => {
            const name = await daiToken.name();
            assert.equal(name, 'Mock DAI Token');
        });
    });

    describe('Dapp Token Deployment', async () => {
        it('has a name', async () => {
            const name = await dappToken.name();
            assert.equal(name, 'DApp Token');
        });
    });

    describe('Token Farm Deployment', async () => {
        it('has a name', async () => {
            const name = await tokenFarm.name();
            assert.equal(name, 'Dapp Token Farm');
        });

        it('contract has tokens', async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address);
            assert.equal(balance.toString(), tokens('1000000'));
        });
    });

    describe('Farming tokens', async () => {
        it('rewards investors for staking mDai tokens', async () => {
            let result;

            // Check initial balance before staking
            result = await daiToken.balanceOf(investor);
            assert.equal(result.toString(), tokens('100'), 'Investor mock Dai wallet balance must be correct before staking');

            // Stake Mock DAI Tokens
            await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor });
            await tokenFarm.stakeTokens(tokens('100'), { from: investor });

            // Check staking result
            result = await daiToken.balanceOf(investor);
            assert.equal(result.toString(), tokens('0'), 'Investor mock Dai wallet balance must be correct after staking');

            // Check initial balance before staking
            result = await daiToken.balanceOf(tokenFarm.address);
            assert.equal(result.toString(), tokens('100'), 'Token Farm mock Dai wallet balance must be correct after staking');

            result = await tokenFarm.stakingBalance(investor);
            assert.equal(result.toString(), tokens('100'), 'Investor staking balance must be correct after staking');

            // Issue tokens
            await tokenFarm.issueTokens({ from: owner });

            result = await dappToken.balanceOf(investor);
            assert.equal(result.toString(), tokens('100'), 'Investor Dapp token wallet balance must be correct after issuance');

            // Ensure only owner can issue tokens
            await tokenFarm.issueTokens({ from: investor }).should.be.rejected;
        });
    }); 
});