// SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract CrowdFunding is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    uint256 private ENTRANCY_FEE = 0.01 ether;
    uint256 private MAX_INVESTORS = 2;

    event entered(
        address indexed investor,
        uint256 indexed amount,
        bool deposited
    );

    struct investor {
        address investorAddress;
        uint256 amountInvested;
        bool hasInvested;
    }

    mapping(address => investor) public mappingInvestor;

    investor[] public investors;

    function initialize() public initializer {
        __Pausable_init();
        __Ownable_init(msg.sender);
    }

    function deposit() external payable {
        require(
            msg.value >= ENTRANCY_FEE,
            "Amount is low than the minimum amount to invest!"
        );
        require(
            !mappingInvestor[msg.sender].hasInvested,
            "You have already participate in this investing phase!"
        );
        require(
            investors.length <= MAX_INVESTORS,
            "Number of maximum investors is reached!"
        );
        mappingInvestor[msg.sender] = investor(msg.sender, msg.value, true);
        investors.push(mappingInvestor[msg.sender]);
        emit entered(msg.sender, msg.value, true);
    }

    function withdraw(uint256 amount) external whenNotPaused {
        require(
            investors.length == MAX_INVESTORS,
            "Maximum of investors not reached yet!"
        );
        require(address(this).balance > 0, "No balance yet to withdraw!");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed.");
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function upgradeFunction() external onlyOwner {
        ENTRANCY_FEE = 0.0123 ether;
        MAX_INVESTORS = 5;
        for (uint i = 0; i < investors.length; i++) {
            mappingInvestor[investors[i].investorAddress].hasInvested = false;
        }
        delete investors;
    }

    function getEntrancyFee() public view returns (uint256) {
        return ENTRANCY_FEE;
    }

    function getMaxInvestors() public view returns (uint256) {
        return MAX_INVESTORS;
    }
}
