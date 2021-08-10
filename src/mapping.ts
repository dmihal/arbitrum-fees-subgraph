import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts"
import { Fee, DateToBlock } from "../generated/schema"
import { ArbGasInfo } from "../generated/Fees/ArbGasInfo"
import { ArbStatistics } from "../generated/Fees/ArbStatistics"

let EIGHTEEN_DECIMALS = BigInt.fromI32(10).pow(18).toBigDecimal()

let ARB_STATS_ADDRESS = Address.fromString('0x000000000000000000000000000000000000006F')
let ARB_GAS_ADDRESS = Address.fromString('0x000000000000000000000000000000000000006C')

export function handleBlock(block: ethereum.Block): void {
  let entity = Fee.load('1')
  if (!entity) {
    entity = new Fee('1')
    entity.totalFeesETH = BigInt.fromI32(0).toBigDecimal()
    entity.totalArbGas = BigInt.fromI32(0)
  }

  let stats = ArbStatistics.bind(ARB_STATS_ADDRESS)
  let gasInfo = ArbGasInfo.bind(ARB_GAS_ADDRESS)

  let weiPerArbGas = gasInfo.getPricesInWei().value5
  let totalArbGas = stats.getStats().value3

  let newGas = totalArbGas - entity.totalArbGas
  let ethFees = newGas.times(weiPerArbGas).divDecimal(EIGHTEEN_DECIMALS)

  entity.totalArbGas = totalArbGas
  entity.totalFeesETH += ethFees
  entity.save()

  let timestampRoundedDown = block.timestamp.toI32() / 86400 * 86400
  let dateEntity = DateToBlock.load(timestampRoundedDown.toString())

  if (dateEntity == null) {
    dateEntity = new DateToBlock(timestampRoundedDown.toString())
    dateEntity.blockNum = block.number
    dateEntity.save()
  }
}
