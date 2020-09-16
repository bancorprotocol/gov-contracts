import {mine} from "../timeTravel";
import {propose, stake} from "./utils";
// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");
  const TestExecutor = artifacts.require("TestExecutor");

  const decimals = 1e18
  const period = 5

  let governance: any;
  let voteToken: any;
  let contractToExecute: any;

  const owner = accounts[0]
  const proposer = accounts[2]
  const voter1 = accounts[3]
  const voter2 = accounts[4]
  const executor = accounts[5]

  before(async () => {
    voteToken = await TestToken.new()
    contractToExecute = await TestExecutor.new()

    // get the proposer some tokens
    await voteToken.mint(
      proposer,
      (100 * decimals).toString()
    )

    // get the voters some tokens
    await voteToken.mint(
      voter1,
      (100 * decimals).toString()
    )
    await voteToken.mint(
      voter2,
      (100 * decimals).toString()
    )
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      voteToken.address
    );
  })

  describe("#execute()", async () => {
    it("should be able to execute", async () => {
      // stake
      await stake(
        governance,
        voteToken,
        proposer,
        2
      )
      // lower period so we dot have to mine 17k blocks
      await governance.setVotePeriod(
        period,
        {from: owner}
      )
      // propose
      const proposalId = await propose(
        governance,
        proposer,
        contractToExecute.address
      )
      // stake
      await stake(
        governance,
        voteToken,
        voter1,
        2
      )
      // vote
      await governance.voteFor(
        proposalId,
        {from: voter1}
      )
      // mine blocks
      await mine(web3, period)
      // execute
      const {logs, blockNumber} = await governance.execute(
        proposalId,
        {from: executor}
      )
      // check that proposal has completed
      assert.strictEqual(
        logs[0].event,
        "ProposalFinished"
      )
      // check that executor has been executed
      const [executedEvent] = await contractToExecute.getPastEvents(
        "Executed",
        {fromBlock: blockNumber, toBlock: blockNumber}
      );
      // check for event
      assert.exists(executedEvent)
      // check for event type
      assert.strictEqual(
        executedEvent.event,
        "Executed"
      )
      // check for right proposal id
      assert.strictEqual(
        executedEvent.returnValues._id,
        proposalId
      )
    })

    it("should fail to execute when proposal is not finished yet", async () => {
      // stake
      await stake(
        governance,
        voteToken,
        proposer,
        2
      )
      // propose
      const proposalId = await propose(
        governance,
        proposer,
        contractToExecute.address
      )
      // fail
      await truffleAssert.fails(
        // execute
        governance.execute(
          proposalId,
          {from: executor}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_NOT_ENDED"
      );
    })

    it("should fail to execute when no quorum is found", async () => {
      const amount = 2
      // proposer stake
      await stake(
        governance,
        voteToken,
        proposer,
        50
      )
      // voter1 stake
      await stake(
        governance,
        voteToken,
        voter1,
        amount
      )
      // voter2 stake
      await stake(
        governance,
        voteToken,
        voter2,
        amount
      )
      // lower period so we dot have to mine 17k blocks
      await governance.setVotePeriod(
        period,
        {from: owner}
      )
      // propose
      const proposalId = await propose(
        governance,
        proposer,
        contractToExecute.address
      )
      // vote
      await governance.voteAgainst(
        proposalId,
        {from: voter1}
      )
      // vote
      await governance.voteFor(
        proposalId,
        {from: voter2}
      )
      // mine blocks
      await mine(web3, period)
      // fail
      await truffleAssert.fails(
        // execute
        governance.execute(
          proposalId,
          {from: executor}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_NO_QUORUM"
      );
    })

    it("should fail to execute unknown proposal", async () => {
      // fail
      await truffleAssert.fails(
        // execute
        governance.execute(
          "0x1337",
          {from: executor}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_NO_PROPOSAL"
      );
    })

    it("should fail to execute proposal that is not open", async () => {
      // stake
      await stake(
        governance,
        voteToken,
        proposer,
        2
      )
      // lower period so we dot have to mine 17k blocks
      await governance.setVotePeriod(
        period,
        {from: owner}
      )
      // propose
      const proposalId = await propose(
        governance,
        proposer,
        contractToExecute.address
      )
      // stake
      await stake(
        governance,
        voteToken,
        voter1,
        2
      )
      // vote
      await governance.voteFor(
        proposalId,
        {from: voter1}
      )
      // mine blocks
      await mine(web3, period)
      // exit
      const {logs, blockNumber} = await governance.execute(
        proposalId,
        {from: executor}
      )
      // check that executor has been executed
      await contractToExecute.getPastEvents(
        "Executed",
        {fromBlock: blockNumber, toBlock: blockNumber}
      );
      // fail
      await truffleAssert.fails(
        // execute
        governance.execute(
          proposalId,
          {from: executor}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_NOT_OPEN"
      );
    })
  })
})
