package com.restaurant.inventory.prep;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UnitsTest {
    @Test void compatibleUnitsNormalizeExactly() {
        assertEquals(new BigDecimal("2500"), Units.toBase(new BigDecimal("2.5"), "kg", "g"));
        assertEquals(new BigDecimal("1250"), Units.toBase(new BigDecimal("1.25"), "L", "ml"));
        assertEquals(new BigDecimal("2.5"), Units.fromBase(new BigDecimal("2500"), "kg"));
    }
    @Test void fractionalCountAndExcessPrecisionAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> Units.toBase(new BigDecimal("1.5"), "count", "count"));
        assertThrows(IllegalArgumentException.class, () -> Units.toBase(new BigDecimal("0.0000001"), "g", "g"));
        assertEquals(new BigDecimal("0.0001"),Units.toBase(new BigDecimal("0.0000001"),"kg","g"));
        assertThrows(IllegalArgumentException.class, () -> Units.toBase(new BigDecimal("1000000000000"), "kg", "g"));
    }
}
