# Results
**Winner:** DeepSeek-r1

**Core Observations:**
- o3 mini can keep up with a lot of moving parts but struggles to understand how things connect together.
- DeepSeek-r1 struggled to keep up with a lot of context. But once it was focused on implementing a specific feature, it crushed it.

**How I'm going to use these models going forward:**
- I'm going to use DeepSeek for adding new features to the application and just know that I need to be very involved in reminding the model about our original goal.
- I'm going to use o3 mini for general brainstorming about building out large improvements in an existing code base and then pass over the plan to DeepSeek.

## o3-mini Review
### Notes
- o3 many seem to do a much better job at Handling, larger context, windows, and could handle the initial prompt that was pretty large look at three files that are huge and also analyze the code base all in one shot and generate a really good plan to execute and implement the new desired feature to the application.
- It took over 20 messages to generate a working solution.

### Pros 
- Fast!
- Large context window. Didn't need to be reminded constantly about what we were trying to do.


### Cons
- Stuck on experimental features due to last training date.
- Took many iterations to get to a working solution. It had a lot of trouble understanding that people create crew projects and that we needed

## DeepSeek-r1 Review
### Overview
- At first, I was worried that this model was going to struggle because right out of the gate. It completely forgot to create the new stream lit file, which was the entire goal of the prompt.
- I was shocked, though once the model was corrected it did a great job implementing the correct solution really fast.
- It took roughly 10 messages to generate a working solution

### Pros 
- Once corrected, DeepSeek did a great job implementing the correct solution.

### Cons
- Didn't automatically say were new files should be created.
- Had to remind the AI to do the right thing.
- Generated duplicate code and had to be corrected.
