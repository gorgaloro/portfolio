# Feature: Weighted Rank Scoring (Pareto Distribution Model)

## Goal
Enhance the fit-scoring system with a weighting formula that follows the **Pareto principle (80/20 rule)** — ensuring the top ~20% of ranked attributes represent roughly 80% of total importance.  
This replaces the previous flat or linear scoring ladder with an exponential curve that more realistically models diminishing importance across ranked attributes.

---

## User Narrative
As a system designer,  
I want the attribute weighting to follow a decaying Pareto-style curve,  
so that the first few attributes dominate the total score while the remainder contribute marginally,  
producing more realistic and interpretable fit percentages.

---

## Functional Flow

1. **Exponential Weighting Function**
   - Apply an exponential decay function by attribute rank:
     ```
     weight_i = 100 * (0.6)^(i - 1)
     ```
     where:
     - `i` = rank position (1 is most important)
     - `0.6` = decay factor controlling steepness  
       (smaller → sharper drop; larger → flatter curve)
     - `100` = normalization base for the top-ranked attribute

2. **Example Weight Table**
   | Rank | Formula | Weight (Rounded) | Cumulative % of Total |
   |------|----------|-----------------|-----------------------|
   | 1 | 100×0.6⁰ | 100 | 34% |
   | 2 | 100×0.6¹ | 60 | 55% |
   | 3 | 100×0.6² | 36 | 78% |
   | 4 | 100×0.6³ | 22 | 85% |
   | 5 | 100×0.6⁴ | 13 | 90% |
   | 6 | 100×0.6⁵ | 8 | 94% |
   | 7 | 100×0.6⁶ | 5 | 96% |
   | 8 | 100×0.6⁷ | 3 | 97% |
   | 9 | 100×0.6⁸ | 2 | 98% |
   | 10–15 | progressively smaller | 1–2 | ~100% |

   The first 3 ranks account for ~78% of total value, satisfying the Pareto distribution target.

3. **Integration with Fit Multipliers**
   - Multiply each weight by its fit color multiplier:
     - Green = 1.0  
     - Yellow = 0.65  
     - Grey = 0  
   - Sum all `Weighted Scores` and divide by the total possible weight to obtain a normalized percentage:
     ```
     overall_fit = Σ(weight_i × multiplier_i) / Σ(weight_i)
     ```

4. **Parameter Tuning**
   - Decay factor (`0.6`) can be adjusted globally via a configuration parameter:
     - `0.5` → Steeper Pareto (top 2–3 dominate)
     - `0.7` → Softer Pareto (middle attributes matter more)
   - System should allow real-time preview of the weighting curve inside the Control Panel (Future Enhancement).

5. **Optional Scaling**
   - If the system expects a fixed denominator (e.g., 580 points), normalize weights:
     ```
     scale = 580 / Σ(weight_i)
     scaled_weight_i = weight_i × scale
     ```

---

## Acceptance Criteria
- [ ] Exponential weighting implemented and integrated with existing fit-score calculations.
- [ ] Top 20% of attributes account for ~80% of total weight.
- [ ] Decay factor can be modified in configuration or Control Panel.
- [ ] Calculation uses:
  ```
  overall_fit = Σ(weight_i × fit_multiplier_i) / Σ(weight_i)
  ```
- [ ] Normalization confirmed for consistent scoring across all jobs.

---

## Desired Outcome
A smooth Pareto-style weighting curve where top-ranked attributes dominate the final score, producing more intuitive and statistically realistic results.  
Adjustable decay factors ensure flexibility while maintaining mathematical simplicity and transparency.
