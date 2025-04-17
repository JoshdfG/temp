// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "lib/forge-std/src/Script.sol";
import "../src/Chat.sol";
import "../src/ENS.sol";

contract DeployScript is Script {
    Chat _chat;
    ENS _ens;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        address _relayer = vm.envAddress("RELAYER");

        _ens = new ENS();
        _chat = new Chat(address(_ens), address(_relayer));

        vm.stopBroadcast();
        writeAddressesToFile(address(_ens), "ens Factory");
        writeAddressesToFile(address(_chat), "chat Address");
    }

    function writeAddressesToFile(address addr, string memory text) public {
        string memory filename = "./deployed_contracts.txt";

        vm.writeLine(
            filename,
            "-------------------------------------------------"
        );
        vm.writeLine(filename, text);
        vm.writeLine(filename, vm.toString(addr));
        vm.writeLine(
            filename,
            "-------------------------------------------------"
        );
    }
}
