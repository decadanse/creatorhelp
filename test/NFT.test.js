// // const assert = require('assert');
// const ganache = require('ganache-cli');
// // constructor
// const Web3 = require('web3');
// // new instance and to connect it to ganache
// const web3 = new Web3(ganache.provider());
// //--------------------------

const NFT = artifacts.require("./NFT");
// const { ethers } = require('ethers'); //for hardhat

require('chai')
    .use(require('chai-as-promised'))
    .should()


// //-------------
// export async function mintAndCheck(
//   nickName: string,
//   to: string,
//   memberships: Memberships
// ) {
//   const nextTokenId = await memberships.nextId();
//   const balance1 = await memberships.balanceOf(to);
//   // check mint and Transfer event
//   await expect(memberships.mint(to, nickName))
//     .to.emit(memberships, "Transfer")
//     .withArgs(ethers.constants.AddressZero, to, nextTokenId);
//   await checkMint(balance1, to, nickName, memberships, nextTokenId);
// }
// //-----------------


contract('NFT', ([deployer, artist, owner1, owner2]) => {
    const cost = web3.utils.toWei('1', 'ether')
    const royalityFee = 25 // 25%
    const transferable = 1 // transferable
    let nft

    
    let accounts

    beforeEach(async () => {
        //---------
        //accounts = await ethers.getSigners(); // ReferenceError: ethers is not defined //for hardhat
        // const Ganache = require("ganache-core");// spawn the test "blockchain" provider
        // const provider = Ganache.provider();// use it like how you would normally use a provider


        // Get a list of all accounts
        // const accounts = await web3.eth.getAccounts();
        // accounts = await web3.eth.getAccounts();
        
        //----------
        nft = await NFT.new(
            "Author's novel universe",
            "BOOK",
            "ipfs://some_link_here/",
            royalityFee, // 25%
            artist, // Artist, writer, creator
            transferable // Transferability
        );



        // const accounts = await web3.eth.getAccounts()
        //---------------------------------------
        
        // const fFactory = new MembershipsFactory__factory(accounts[0]);
        // factory = await fFactory.deploy();
        // await factory.deployed();
        // ownerAddr = await accounts[1].getAddress();

        // const address = await createAndCheckProxy(
        //   factory,
        //   tokenName,
        //   tokenSymbol,
        //   organization,
        //   transferable,
        //   ownerAddr
        // );

        // const mFactory = new Memberships__factory(accounts[1]);
        // memberships = mFactory.attach(address);
        // wrongOwnerM = memberships.connect(await accounts[0].getAddress());
    //---------------------------------------



    })

    describe('deployment', () => {
        it('returns the deployer', async () => {
            const result = await nft.owner()
            result.should.equal(deployer)
        })

        it('returns the artist', async () => {
            const result = await nft.artist()
            result.should.equal(artist)
        })

        it('returns the royality fee', async () => {
            const result = await nft.royalityFee()
            result.toString().should.equal(royalityFee.toString())
        })

        it('sets the royality fee', async () => {
            const newRoyalityFee = 50 // 50%

            await nft.setRoyalityFee(newRoyalityFee)

            const result = await nft.royalityFee()
            result.toString().should.equal(newRoyalityFee.toString())
        })

        it('transferable', async () => {
            const result = await nft.transferable()
            assert.equal(result, true, "transferable");
            // result.should.equal(true)
        })
    })

    describe('royalities', async () => {
        const salePrice = web3.utils.toWei('10', 'ether')
        const totalRoyality = salePrice * 0.25
        let result

        beforeEach(async () => {
            await nft.mint({ from: owner1, value: cost })
        })

        it('initially belongs to owner1', async () => {
            const result = await nft.balanceOf(owner1)
            result.toString().should.equal('1')
        })

        it('successfully transfers to owner2', async () => {
            await nft.approve(owner2, 1, { from: owner1 })
            await nft.transferFrom(owner1, owner2, 1, { from: owner2, value: salePrice })

            result = await nft.balanceOf(owner1)
            result.toString().should.equal('0')

            result = await nft.balanceOf(owner2)
            result.toString().should.equal('1')
        })

        it('updates ether balances', async () => {
            // Approve sale
            await nft.approve(owner2, 1, { from: owner1 })

            const artistBalanceBefore = await web3.eth.getBalance(artist)
            const owner1BalanceBefore = await web3.eth.getBalance(owner1)

            // Initiate transfer
            await nft.transferFrom(owner1, owner2, 1, { from: owner2, value: salePrice })

            const artistBalanceAfter = await web3.eth.getBalance(artist)
            const owner1BalanceAfter = await web3.eth.getBalance(owner1)

            // If balances update, we know owner2 paid
            artistBalanceAfter.toString().should.equal((Number(artistBalanceBefore) + totalRoyality).toString())
            owner1BalanceAfter.toString().should.equal((Number(owner1BalanceBefore) + (salePrice - totalRoyality)).toString())
        })
    })

//__________________________________________________________________________________________________________________________-
// from memberships.spec.ts

    describe("approve, transfer, safeTransferFrom", () => {
        // let transferability

        it("doesn't allow approve, transferFrom, or safeTransferFrom if transferable is false", async () => {
            const aliceAddr = await owner1;//accounts[0].getAddress();
            const bobAddr = await owner2;//accounts[1].getAddress();
            // await mintAndCheck("Alice", aliceAddr, transferable); //here's an error
            const tokenId = (await nft.nextId()).sub(1); //heres the problem which can be solved if go deep inti MembershipsFactory

//isApprovedForAll(address owner, address operator)
//maybe delite approve


            // await expect(nft.approve(bobAddr, tokenId)).to.be.revertedWith(
            // "Memberships: not transferable"
            // );

            await expect(nft.transferFrom(aliceAddr, bobAddr, tokenId)).to.be.revertedWith("Memberships: not transferable");

            await expect(nft.callStatic["safeTransferFrom(address,address,uint256)"](
              aliceAddr,
              bobAddr,
              tokenId
            )).to.be.revertedWith("Memberships: not transferable");

            await expect(nft.callStatic["safeTransferFrom(address,address,uint256,bytes)"](aliceAddr, bobAddr, tokenId, randomBytes(5)
            )).to.be.revertedWith("Memberships: not transferable");
        });

    })

})