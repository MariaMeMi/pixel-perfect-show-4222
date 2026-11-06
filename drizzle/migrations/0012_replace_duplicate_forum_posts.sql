delete from forum_posts where title='My first week tracking redness';
insert into forum_posts(author_id,category_id,title,body,created_at,updated_at) select '81795335-cfd9-4645-aed1-bf88d5e22742',id,'Why does my face get red even when I do everything right?','I''ve tried avoiding spicy food, alcohol, hot showers, and even certain skincare products, but my face still gets red for no obvious reason. Sometimes it feels like my skin has a mind of its own.

Has anyone else experienced random flare-ups? Did you eventually figure out what was triggering them?',now()-interval '1 hours',now()-interval '1 hours' from forum_categories where slug='triggers-lifestyle';
insert into forum_posts(author_id,category_id,title,body,created_at,updated_at) select '81795335-cfd9-4645-aed1-bf88d5e22742',id,'Azelaic acid: miracle product or irritation nightmare?','I keep seeing people recommend azelaic acid for rosacea, but the experiences seem completely different. Some people say it transformed their skin, while others report burning, dryness, and even more redness.

If you''ve tried azelaic acid, what was your experience? How long did it take to notice any changes?',now()-interval '4 hours',now()-interval '4 hours' from forum_categories where slug='treatments-routines';
insert into forum_posts(author_id,category_id,title,body,created_at,updated_at) select '81795335-cfd9-4645-aed1-bf88d5e22742',id,'Why does even gentle skincare burn my face?','Products labeled "sensitive skin" or "gentle" don''t always feel gentle when you have rosacea. Sometimes even a basic moisturizer can cause stinging, warmth, or redness.

Have you found a moisturizer or cleanser your skin actually tolerates? What ingredients do you personally avoid?',now()-interval '7 hours',now()-interval '7 hours' from forum_categories where slug='treatments-routines';
insert into forum_posts(author_id,category_id,title,body,created_at,updated_at) select '81795335-cfd9-4645-aed1-bf88d5e22742',id,'Does anyone else feel exhausted from constantly thinking about their skin?','Some days, the hardest part of rosacea isn''t the redness itself. It''s constantly checking mirrors, worrying about flare-ups, and wondering whether other people notice your skin.

How do you deal with the emotional side of rosacea? Has anything helped you feel more confident?',now()-interval '10 hours',now()-interval '10 hours' from forum_categories where slug='emotional-support';
insert into forum_posts(author_id,category_id,title,body,created_at,updated_at) select '81795335-cfd9-4645-aed1-bf88d5e22742',id,'What actually helped your rosacea improve?','There are so many products, treatments, and routines recommended for rosacea that it''s difficult to know where to start.

I''d love to hear real experiences from people who have seen improvements.

What made the biggest difference for you? Was it a prescription, a treatment, a change in routine, or something else?',now()-interval '13 hours',now()-interval '13 hours' from forum_categories where slug='general';
insert into forum_posts(author_id,category_id,title,body,created_at,updated_at) select '81795335-cfd9-4645-aed1-bf88d5e22742',id,'How long did it take you to get a rosacea diagnosis?','For years I thought my redness was just sensitive skin or a reaction to new products. It took a long time before I saw a professional who mentioned rosacea.

How long did it take you to get answers? What would you tell someone who has just started noticing these symptoms?',now()-interval '16 hours',now()-interval '16 hours' from forum_categories where slug='rosacea-basics';