package com.restaurant.inventory.prep;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;

/** Exact conversions between compatible kitchen units. No density/yield assumptions. */
public final class Units {
    private Units() {}
    public static String baseUnit(String unit) {
        return switch (unit.toLowerCase(Locale.ROOT)) {
            case "kg", "g" -> "g";
            case "l", "ml", "liters", "litres" -> "ml";
            case "count", "pieces" -> "count";
            default -> throw new IllegalArgumentException("Unknown unit: " + unit);
        };
    }
    public static BigDecimal factor(String unit) {
        baseUnit(unit);
        return switch (unit.toLowerCase(Locale.ROOT)) {
            case "kg", "l", "liters", "litres" -> new BigDecimal("1000");
            default -> BigDecimal.ONE;
        };
    }
    public static BigDecimal toBase(BigDecimal quantity, String unit, String expectedBase) {
        if (!baseUnit(unit).equals(expectedBase)) throw new IllegalArgumentException("Incompatible units: " + unit + " cannot convert to " + expectedBase);
        if (quantity.signum() < 0) throw new IllegalArgumentException("Quantity must be nonnegative.");
        if (expectedBase.equals("count") && quantity.stripTrailingZeros().scale() > 0) throw new IllegalArgumentException("Count items require whole quantities.");
        var normalized=clean(quantity.multiply(factor(unit)));
        if(normalized.scale()>6 || normalized.precision()-normalized.scale()>14)throw new IllegalArgumentException("Quantity exceeds the ledger's precision or range. Use at most 6 decimal places in g, ml, or count.");
        return normalized;
    }
    public static BigDecimal fromBase(BigDecimal quantity, String displayUnit) {
        return clean(quantity.divide(factor(displayUnit), 12, RoundingMode.UNNECESSARY));
    }
    public static BigDecimal clean(BigDecimal value) { return new BigDecimal(value.stripTrailingZeros().toPlainString()); }
    public static String text(BigDecimal value) { return clean(value).toPlainString(); }
}
