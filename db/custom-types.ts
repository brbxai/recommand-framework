import { SQL, sql } from "drizzle-orm"
import { customType, type Precision } from "drizzle-orm/pg-core"

// https://github.com/drizzle-team/drizzle-orm/issues/2388#issuecomment-3003296696
export const autoUpdateTimestamp = (config?: { precision?: Precision }) => customType<{
    data: Date
    driverData: string
    config: { precision?: Precision }
}>({
    dataType(config) {
        const precision = config?.precision === undefined ? "" : ` (${config.precision})`
        return `timestamp${precision} with time zone`
    },
    fromDriver(value: string) {
        return new Date(value + "+0000")
    },
    toDriver(value: Date | SQL) {
        if ("toISOString" in value) {
            return value.toISOString()
        }
        return value
    },
})("updated_at", config).notNull().default(sql`now()`).$onUpdate(() => sql`CURRENT_TIMESTAMP`)