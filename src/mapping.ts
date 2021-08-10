import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts"
import { Fees, DateToBlock } from "../generated/schema"
import { ArbGasInfo } from "../generated/Fees/ArbGasInfo"
import { ArbStatistics } from "../generated/Fees/ArbStatistics"

let EIGHTEEN_DECIMALS = BigInt.fromI32(10).pow(18).toBigDecimal()
let EIGHT_DECIMALS = BigInt.fromI32(10).pow(8).toBigDecimal()

export function handleBlock(block: ethereum.Block): void {
  let entity = Fees.load('1')
  if (!entity) {
    entity = new Fees('1')
    entity.feesETH = BigInt.fromI32(0).toBigDecimal()
    entity.totalArbGas = BigInt.fromI32(0)
  }

  let stats = ArbStatistics.bind(Address.fromString('0x000000000000000000000000000000000000006F'))
  let gasInfo = ArbGasInfo.bind(Address.fromString('0x000000000000000000000000000000000000006C'))

  let weiPerArbGas = gasInfo.getPricesInWei().value5
  let totalArbGas = stats.getStats().value3

  let newGas = totalArbGas - entity.totalArbGas
  let ethFees = newGas.times(weiPerArbGas).divDecimal(EIGHTEEN_DECIMALS)

  entity.totalArbGas = totalArbGas
  entity.feesETH += ethFees
  entity.save()

  let timestampRoundedDown = block.timestamp.toI32() / 86400 * 86400
  let dateEntity = DateToBlock.load(timestampRoundedDown.toString())

  if (dateEntity == null) {
    dateEntity = new DateToBlock(timestampRoundedDown.toString())
    dateEntity.blockNum = block.number
    dateEntity.save()
  }
}
