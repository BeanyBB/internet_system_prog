import bcrypt from 'bcrypt';
import { initDb, run, get, all } from './db.js';

const PASSWORD_HASH = await bcrypt.hash('chirp123', 10);

const FAKE_USERS = [
  { username: 'alex_codes', bio: 'Software engineer. TypeScript enthusiast. Building things on the internet.' },
  { username: 'sarah_travels', bio: 'Travel blogger. 47 countries and counting ✈️ Always planning the next trip.' },
  { username: 'fitnessmike', bio: 'Personal trainer. Helping people hit their goals one rep at a time 💪' },
  { username: 'foodie_jane', bio: 'Food writer & recipe developer. Eat well, live well.' },
  { username: 'gamer_lou', bio: 'PC gamer. Speedrunner. Currently obsessed with roguelikes.' },
  { username: 'daily_dose_kira', bio: 'Spreading positivity every day. Mindfulness & motivation.' },
  { username: 'devrel_sam', bio: 'Developer advocate. Open source contributor. Conference speaker.' },
  { username: 'astro_pete', bio: 'Amateur astronomer. Space nerd. Nothing beats a clear night sky.' },
  { username: 'bookclub_maya', bio: 'Reading 52 books a year. Book reviews and recommendations.' },
  { username: 'design_nadia', bio: 'UI/UX designer. Making the web a prettier place.' },
  { username: 'crypto_carlos', bio: 'Web3 builder. DeFi enthusiast. Not financial advice.' },
  { username: 'dog_mom_steph', bio: 'Professional dog mom 🐕 Rescue advocate. All dogs are good dogs.' },
  { username: 'ml_researcher_jo', bio: 'ML researcher at a university lab. Thinking about embeddings 24/7.' },
  { username: 'startup_founder_kai', bio: 'Serial founder. Currently building something cool. Hiring!' },
  { username: 'coffee_addict_ray', bio: 'Barista turned software dev. I review coffee shops so you don\'t have to.' },
  { username: 'parent_of_three', bio: 'Dad of 3. Sharing the chaos of family life, one day at a time.' },
  { username: 'plant_witch_luna', bio: 'Plant parent to 87 houseplants. Will talk about my monstera forever.' },
  { username: 'retro_gaming_felix', bio: 'Classic game collector. NES to PS2. Preserving gaming history.' },
  { username: 'newbie_coder_tomas', bio: 'Bootcamp grad. Learning every day. Documenting the journey.' },
  { username: 'minimalist_wei', bio: 'Less is more. Writing about intentional living and productivity.' },
];

const POSTS_BY_PERSONA = {
  alex_codes: [
    'Just shipped a feature I\'ve been working on for two weeks. Nothing beats that feeling.',
    'Hot take: TypeScript has made me a better JavaScript developer even when I\'m not using types.',
    'Pair programming session today reminded me how much I learn from watching others code.',
    'Spent 3 hours debugging a race condition. It was a missing await. Always a missing await.',
    'My favorite git command is `git log --oneline --graph`. Highly recommend.',
    'Code review tip: comment on what you learned, not just what to change.',
    'Finally got around to trying Bun. The startup speed is genuinely impressive.',
    'Reminder: your future self is your most important code reviewer.',
    'The best documentation is the code that doesn\'t need documentation.',
    'Deployed to prod on a Friday again. Living dangerously.',
    'Learning Rust. My brain hurts but in a good way.',
    'Opened 12 Stack Overflow tabs today. Closed 11 without reading them.',
  ],
  sarah_travels: [
    'Woke up to a sunrise over the Sahara this morning. Some places just don\'t feel real.',
    'Pro travel tip: always book the window seat. Non-negotiable.',
    'Missed my flight. Ended up spending 6 extra hours in Lisbon. Worst day / best day.',
    'The best souvenirs are the stories, not the stuff. (I still buy magnets though.)',
    'Just discovered a tiny cafe in Porto that serves the best pastel de nata I\'ve ever had.',
    'Travel budget breakdown from my Japan trip — surprisingly affordable if you plan well.',
    'Met a stranger on a train who recommended a hike that changed my entire itinerary.',
    'Packing cubes changed my life. I\'m not exaggerating.',
    'Nothing humbles you like trying to order food in a language you don\'t speak.',
    'Country 47: Morocco. Absolutely breathtaking.',
    'Solo travel is terrifying and liberating in equal measure.',
    'The airport lounge > overpriced gate food. That\'s the whole tweet.',
  ],
  fitnessmike: [
    'You don\'t need to feel motivated to show up. Show up and motivation follows.',
    'Today\'s client hit a 200lb deadlift PR. Weeks of work paying off. So proud.',
    'Sleep is the most underrated performance enhancer. More than any supplement.',
    'Form > weight. Always. Ego lifts get you injured, not strong.',
    'Running 5k this morning in the cold. Your comfort zone is not where gains live.',
    'Reminder: rest days are part of the program. Not a skip day.',
    'Protein first. Everything else second.',
    'Gym crowded at 6am? Find another gym. Just kidding. Kind of.',
    'Three years ago I couldn\'t do a single pull-up. Did 12 this morning.',
    'Consistency over intensity. Every time.',
    'Pre-workout is just expensive coffee. Change my mind.',
    'Track your lifts. What gets measured gets improved.',
  ],
  foodie_jane: [
    'Made a brown butter cake today. The kitchen smells incredible.',
    'Finally cracked the perfect scrambled eggs recipe. Low heat. Patience. Butter.',
    'Tried the new ramen spot downtown. The tonkotsu broth is legitimately top tier.',
    'Fermentation update: my sourdough starter is thriving. We named her Margot.',
    'Recipe tip: season at every stage, not just at the end.',
    'Ate my weight in tacos at the street market. Zero regrets.',
    'Homemade pasta is 30% cooking and 70% therapy.',
    'The line at this bakery was worth every minute.',
    'Cooking for one is an underappreciated art form.',
    'Food photography is harder than it looks. Spent 45 minutes arranging a salad.',
    'Olive oil is not a cooking fat, it\'s a lifestyle.',
    'Tried a Michelin-starred restaurant last night. Gorgeous food. Tiny portions.',
  ],
  gamer_lou: [
    'Just hit a new PB on Hollow Knight. Steel Soul mode is no joke.',
    'Balatro is the most addictive game I\'ve played in years. Send help.',
    'Opinion: save points should never be more than 20 minutes apart.',
    'Finished my first speedrun of Celeste. 2 hours 14 minutes. Not bad for a first attempt.',
    'The indie game scene in 2024 is absolutely incredible.',
    'Finished Elden Ring DLC. It\'s brutally good.',
    'My PC build finally complete. 4 months and way too much money.',
    'Nothing like a couch co-op session on a rainy day.',
    'Loading screens are history. I love SSDs.',
    'Replaying Disco Elysium for the third time. Still finding new dialogue.',
    'Unpopular opinion: tutorial areas should be skippable.',
    'Just pre-ordered something I know will disappoint me. The cycle continues.',
  ],
  daily_dose_kira: [
    'Your energy is limited. Spend it on people who pour back into you.',
    'One small step today is better than a perfect plan you never start.',
    'Gratitude isn\'t toxic positivity. It\'s just noticing what\'s good.',
    'Rest is productive. Rest is necessary. Rest is not lazy.',
    'You are allowed to change your mind. Growth requires it.',
    'Morning pages changed my relationship with my thoughts. Highly recommend.',
    'People who show up for others quietly are the real MVPs.',
    'Not every problem needs a solution right now. Some need sleep.',
    'Be the kind of person you needed when you were younger.',
    'Your nervous system isn\'t broken. It just needs practice with calm.',
    'Saying no is a complete sentence.',
    'Five years from now, today will just be a story you tell.',
  ],
  devrel_sam: [
    'Just gave my first conference talk. Terrifying. Would do it again tomorrow.',
    'Documentation is a love letter to your future users.',
    'The best devrel work is invisible — it feels like the product just makes sense.',
    'Running a workshop today. Nothing better than watching someone debug a problem in real time.',
    'Open source tip: a clear CONTRIBUTING.md is worth more than any roadmap.',
    'Replied to 40 GitHub issues today. My todo list is grateful.',
    'The community slack is popping off about the new API changes. Love to see it.',
    'Cold emailing developers to try your product is humbling.',
    'Built a sample app in a weekend to show the new SDK. Shipped it Monday.',
    'Feedback loops from real users are priceless.',
  ],
  astro_pete: [
    'Jupiter was stunning last night through the 8-inch Dobsonian. Could see two cloud bands clearly.',
    'New telescope arrived. Already planning my first deep sky session.',
    'Clear skies finally! Mars opposition is 3 weeks out.',
    'Astrophotography is 10% shooting and 90% stacking in post.',
    'The James Webb images never get old. Scale of the universe type of awe.',
    'Light pollution map updated. Found a dark sky site 45 minutes from my house.',
    'Saturn\'s rings are tilting toward us this year. Best views in a decade.',
    'Asked my neighbor to turn off their porch light. They said yes. Huge win.',
    'Meteor shower tonight. Setting an alarm for 2am like an absolute nerd.',
    'First time seeing the Andromeda galaxy with my own eyes. Speechless.',
  ],
  bookclub_maya: [
    'Currently reading: The Name of the Wind. Why did nobody force me to read this sooner?',
    '2024 book tally: 38 books. On track to beat last year.',
    'Library card is the most underused resource available to most of us.',
    'DNF rate this year: 12%. Getting better at trusting my gut after 50 pages.',
    'Rereading Piranesi. Even better the second time.',
    'Annotation tip: sticky tabs > writing in margins. Change my mind.',
    'Local indie bookstore had a sale. I have a problem.',
    'Finished Tomorrow and Tomorrow and Tomorrow in two sittings. Devastating and beautiful.',
    'Hard disagree: audiobooks absolutely count.',
    'Reading before bed is the only screen time that improves my sleep.',
  ],
  design_nadia: [
    'Spent 3 hours on a button. This is the job.',
    'Good design is invisible. That\'s the hardest part to explain to clients.',
    'Dark mode shouldn\'t just invert colors. It should rethink contrast entirely.',
    'Typography is 90% of design. The rest is just breathing room.',
    'Accessibility isn\'t a checklist. It\'s a mindset.',
    'Got a client revision asking to "make the logo bigger". Classic.',
    'Figma components clicked for me today in a way they never had before.',
    'Redesigned my portfolio again. Designers never ship their own work.',
    'The best UI pattern is the one the user never has to think about.',
    'Color theory is endlessly fascinating.',
  ],
  crypto_carlos: [
    'Gas fees down 90% since the L2 shift. The future is finally usable.',
    'Built a small DeFi dashboard over the weekend. On-chain data is wild.',
    'Reminder: your keys, your coins. Not your keys, not your coins.',
    'Smart contract audit came back clean. Team is hyped.',
    'The discourse around crypto is either maximalist or doomer. Where\'s the nuance?',
    'EIP-4844 was quietly one of the most important upgrades.',
    'Onboarding a non-crypto friend to a wallet. The UX still needs work.',
    'Deployed to testnet. Mainnet soon.',
  ],
  dog_mom_steph: [
    'Biscuit just learned "stay" and immediately forgot it. We love him anyway.',
    'Rescue dogs have a sixth sense for when you\'re sad.',
    'Dog park drama today: two golden retrievers had a disagreement over a tennis ball.',
    'Biscuit got a haircut. He is unrecognizable and extremely judgmental about it.',
    'Reminder to adopt, don\'t shop. Shelters are full of amazing dogs.',
    'Nothing heals a bad day like a dog who is just so happy you\'re home.',
    'Biscuit learned to ring the bell by the door to go out. Smartest boy alive.',
    'Dog tax: current Biscuit status: asleep on my feet as I type this.',
  ],
  ml_researcher_jo: [
    'Struggling with a training instability that only shows up at certain batch sizes.',
    'Embeddings are just the universe projecting meaning into math.',
    'Reproduced a result from a 2021 paper. The gap between paper and code is real.',
    'Spent the morning reading papers. Still have more questions than answers.',
    'Transformer attention is intuitive until it isn\'t.',
    'Fine-tuning a small LLM for a narrow domain task. Early results are promising.',
    'Hot take: eval benchmarks are broken and everyone knows it.',
    'GPU memory math is an art and a curse.',
    'My labmates and I have a bet on whether scaling laws hold another log unit.',
  ],
  startup_founder_kai: [
    'Month 3. First paying customer. Nothing will ever feel like this again.',
    'Founder life: equal parts exhilarating and terrifying.',
    'Hired our first employee today. We are officially a company.',
    'Rejected from our fifth accelerator. Moving anyway.',
    'Lesson: shipping is the only feedback that matters.',
    'Talked to 20 potential customers this week. The patterns are becoming clear.',
    'Saying no to a feature that customers asked for. The hardest and most important skill.',
    'The best time to talk to users is before you build. The second best time is right now.',
  ],
  coffee_addict_ray: [
    'Tried a washed Ethiopian from a new roaster. Tasting notes: blueberry, lavender, confusion.',
    'Pulled the best espresso shot of my life this morning. Won\'t be able to replicate it.',
    'The coffee shop on 5th is playing lo-fi hip hop. I\'ve been here 4 hours.',
    'People who say they don\'t like coffee have just had bad coffee.',
    'Cleaned my grinder today. Changed my life. Clean your grinder.',
    'Attended a cupping session. I am now insufferable about coffee.',
    'Switched from a French press to pour-over. Cleaner cup. More ritual. Worth it.',
    'Decaf at 4pm is not defeat. It is wisdom.',
  ],
  parent_of_three: [
    'My 7-year-old just told me that math class is "basically a waste of time". She\'s not wrong.',
    'Saturday morning pancakes. This is what life is for.',
    'Kids\' bedtime is theoretically 8pm. Reality is a different story.',
    'Three kids in car. Requested songs: three different songs. Nobody wins.',
    'My oldest helped her little brother tie his shoes. I had to leave the room I was so proud.',
    'Parenting tip: pick your battles. There are too many battles.',
    'The pure joy of a child\'s laughter is unmatched by anything in the adult world.',
    'Just sat through a 45-minute school play in which my son had exactly one line.',
  ],
  plant_witch_luna: [
    'New monstera leaf unfurling. I have watched it for an hour. I regret nothing.',
    'Finally propagated my rubber tree. It took 3 months. Worth it.',
    'Repotting day. My back is ruined. The plants are thriving.',
    'Person at the nursery sold me a rare alocasia. I have a problem.',
    'My pothos is taking over the bookshelf. I\'m going to let it.',
    'Overwatering is how you show love and also how you kill things. Find the balance.',
    'Started a plant propagation journal. Yes I\'m serious.',
    'Greenhouse trip today. Left with 6 plants. "Just looking" is a lie I tell myself.',
  ],
  retro_gaming_felix: [
    'Found a complete-in-box copy of EarthBound at a flea market. Best day of my year.',
    'Repaired a Gameboy Color with a new IPS screen mod. Looks incredible.',
    'The PS1 startup screen hits different every single time.',
    'People forget how weird and experimental the N64 era was.',
    'CRT gaming is a vibe that emulation can never fully replicate.',
    'Completed my SNES RPG collection. 14 years in the making.',
    'Donated a duplicate set of NES games to a local library. Spread the love.',
    'Cleaned contacts on 20-year-old cartridges. Works like new.',
  ],
  newbie_coder_tomas: [
    'Week 8 of learning to code. Wrote my first working API today. I screamed.',
    'CSS still confuses me. I think it confuses everyone.',
    'Pair programming with a senior dev today. Learned more in 2 hours than a week of tutorials.',
    'Got my first PR merged to an open source project. It was a typo fix but it counts.',
    'Imposter syndrome is real. Still showing up anyway.',
    'Built a todo app for the fifth time. This time I actually understand what I\'m building.',
    'JavaScript callbacks make sense now. Async/await still scary.',
    'Bootcamp is hard. I am tired. I am not quitting.',
  ],
  minimalist_wei: [
    'Deleted 200 photos from my camera roll. Keeping the best 40. It feels like breathing.',
    'One in, one out policy for physical objects. Works in code too.',
    'Spent Sunday doing nothing. It was productive in the only way that matters.',
    'The closet project is done. I own 37 items of clothing now.',
    'Counterintuitive: owning less is more expensive upfront. Worth it long-term.',
    'Saying no to an event I didn\'t want to attend. Protecting my time is not selfish.',
    'Unsubscribed from 14 email lists today. Inbox zero is a spiritual practice.',
    'Digital minimalism: deleted 5 apps. Phone is boring and I feel better.',
  ],
};

const AVATAR_COLORS = [
  '#0f5cc0', '#7c3aed', '#db2777', '#059669',
  '#d97706', '#dc2626', '#0891b2', '#65a30d',
  '#9333ea', '#ea580c', '#0d9488', '#be123c',
];

// Pre-assign distinct colors to each fake user
const USER_COLORS = {};
const shuffled = [...AVATAR_COLORS, ...AVATAR_COLORS].slice(0, FAKE_USERS.length);
FAKE_USERS.forEach((u, i) => { USER_COLORS[u.username] = shuffled[i]; });

// engagement tier mapping
const POPULAR_USERS = ['daily_dose_kira', 'fitnessmike', 'sarah_travels', 'foodie_jane', 'startup_founder_kai'];
const MID_USERS = ['alex_codes', 'devrel_sam', 'bookclub_maya', 'gamer_lou', 'design_nadia', 'dog_mom_steph', 'coffee_addict_ray', 'plant_witch_luna', 'astro_pete', 'parent_of_three'];
const LOW_USERS = ['crypto_carlos', 'ml_researcher_jo', 'retro_gaming_felix', 'newbie_coder_tomas', 'minimalist_wei'];

function randomDate(daysAgo) {
  const now = Date.now();
  const then = now - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(then + Math.random() * (now - then)).toISOString().replace('T', ' ').slice(0, 19);
}

function likeRate(authorUsername) {
  if (POPULAR_USERS.includes(authorUsername)) return 0.3 + Math.random() * 0.3; // 30–60%
  if (MID_USERS.includes(authorUsername)) return 0.1 + Math.random() * 0.15;    // 10–25%
  return 0.02 + Math.random() * 0.06;                                             // 2–8%
}

await initDb();

// Insert users
const userIds = {};
for (const u of FAKE_USERS) {
  const existing = await get('SELECT id FROM users WHERE username = ?', [u.username]);
  if (existing) {
    userIds[u.username] = existing.id;
    await run('UPDATE users SET avatar_color = ? WHERE id = ?', [USER_COLORS[u.username], existing.id]);
    console.log(`  Updated color for: ${u.username}`);
    continue;
  }
  const result = await run(
    'INSERT INTO users (username, password_hash, bio, avatar_color) VALUES (?, ?, ?, ?)',
    [u.username, PASSWORD_HASH, u.bio, USER_COLORS[u.username]]
  );
  userIds[u.username] = result.id;
  console.log(`  Created user: ${u.username} (id=${result.id})`);
}

// Insert posts
const postIdsByUser = {};
for (const u of FAKE_USERS) {
  const templates = POSTS_BY_PERSONA[u.username] || [];
  postIdsByUser[u.username] = [];
  for (const content of templates) {
    const existing = await get(
      'SELECT id FROM posts WHERE user_id = ? AND content = ?',
      [userIds[u.username], content]
    );
    if (existing) {
      postIdsByUser[u.username].push(existing.id);
      continue;
    }
    const result = await run(
      'INSERT INTO posts (user_id, content, created_at) VALUES (?, ?, ?)',
      [userIds[u.username], content, randomDate(30)]
    );
    postIdsByUser[u.username].push(result.id);
  }
  console.log(`  Posts for ${u.username}: ${postIdsByUser[u.username].length}`);
}

// Distribute likes
const allUserIds = Object.values(userIds);
for (const author of FAKE_USERS) {
  const rate = likeRate(author.username);
  for (const postId of (postIdsByUser[author.username] || [])) {
    for (const likerId of allUserIds) {
      if (likerId === userIds[author.username]) continue;
      if (Math.random() < rate) {
        await run(
          'INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)',
          [likerId, postId]
        );
      }
    }
  }
}
console.log('  Likes distributed.');

// Create some follow relationships
const followPairs = [
  ['alex_codes', 'devrel_sam'],
  ['alex_codes', 'ml_researcher_jo'],
  ['alex_codes', 'newbie_coder_tomas'],
  ['devrel_sam', 'alex_codes'],
  ['devrel_sam', 'startup_founder_kai'],
  ['sarah_travels', 'foodie_jane'],
  ['sarah_travels', 'coffee_addict_ray'],
  ['foodie_jane', 'sarah_travels'],
  ['foodie_jane', 'coffee_addict_ray'],
  ['fitnessmike', 'daily_dose_kira'],
  ['fitnessmike', 'parent_of_three'],
  ['daily_dose_kira', 'fitnessmike'],
  ['daily_dose_kira', 'minimalist_wei'],
  ['daily_dose_kira', 'bookclub_maya'],
  ['gamer_lou', 'retro_gaming_felix'],
  ['gamer_lou', 'alex_codes'],
  ['retro_gaming_felix', 'gamer_lou'],
  ['bookclub_maya', 'daily_dose_kira'],
  ['bookclub_maya', 'minimalist_wei'],
  ['design_nadia', 'alex_codes'],
  ['design_nadia', 'startup_founder_kai'],
  ['startup_founder_kai', 'devrel_sam'],
  ['startup_founder_kai', 'design_nadia'],
  ['coffee_addict_ray', 'foodie_jane'],
  ['coffee_addict_ray', 'minimalist_wei'],
  ['plant_witch_luna', 'dog_mom_steph'],
  ['dog_mom_steph', 'plant_witch_luna'],
  ['astro_pete', 'ml_researcher_jo'],
  ['ml_researcher_jo', 'alex_codes'],
  ['newbie_coder_tomas', 'alex_codes'],
  ['newbie_coder_tomas', 'devrel_sam'],
  ['minimalist_wei', 'daily_dose_kira'],
  ['parent_of_three', 'dog_mom_steph'],
  ['crypto_carlos', 'startup_founder_kai'],
];

for (const [followerName, followingName] of followPairs) {
  const followerId = userIds[followerName];
  const followingId = userIds[followingName];
  if (!followerId || !followingId) continue;
  await run(
    'INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
    [followerId, followingId]
  );
}
console.log(`  Follow relationships created: ${followPairs.length}`);

// Comments
const COMMENT_POOL = [
  'This is so true!',
  'Couldn\'t agree more.',
  'Love this.',
  'Same experience here.',
  'This made my day.',
  'Needed to hear this.',
  'Absolutely. 100%.',
  'Wait, really? That\'s wild.',
  'How long did this take you?',
  'Thanks for sharing this.',
  'This is goals.',
  'I felt this personally.',
  'Ok but same though.',
  'Following for more like this.',
  'This is the content I come here for.',
  'Ha! Relatable.',
  'That\'s actually impressive.',
  'I have so many questions.',
  'This changes everything.',
  'Underrated post.',
  'More people need to see this.',
  'Saving this for later.',
  'Not me reading this at 2am.',
  'The accuracy of this 😭',
  'I laughed way too hard at this.',
  'Honestly same.',
  'Been saying this for years.',
  'Finally someone said it.',
  'How did you manage that?',
  'This is the way.',
  'I needed this reminder today.',
  'Wait this is actually helpful.',
  'Taking notes.',
  'I\'m stealing this idea.',
  'Classic.',
  'Respect.',
  'Glad I\'m not the only one.',
  'Okay this is actually impressive.',
  'Peak content.',
  'The audacity and I love it.',
];

function commentRate(authorUsername) {
  if (POPULAR_USERS.includes(authorUsername)) return 0.25 + Math.random() * 0.25; // 25–50%
  if (MID_USERS.includes(authorUsername)) return 0.08 + Math.random() * 0.12;     // 8–20%
  return 0.02 + Math.random() * 0.05;                                               // 2–7%
}

function randomComment() {
  return COMMENT_POOL[Math.floor(Math.random() * COMMENT_POOL.length)];
}

// Collect all post ids
const allPostIds = [];
for (const u of FAKE_USERS) {
  for (const postId of (postIdsByUser[u.username] || [])) {
    allPostIds.push({ postId, authorUsername: u.username });
  }
}

// Insert comments with varying engagement
const commentIds = [];
for (const { postId, authorUsername } of allPostIds) {
  const rate = commentRate(authorUsername);
  for (const commenterId of allUserIds) {
    if (commenterId === userIds[authorUsername]) continue;
    if (Math.random() < rate) {
      const existing = await get(
        'SELECT id FROM comments WHERE post_id = ? AND user_id = ?',
        [postId, commenterId]
      );
      if (existing) {
        commentIds.push({ id: existing.id, authorId: commenterId });
        continue;
      }
      const result = await run(
        'INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)',
        [postId, commenterId, randomComment(), randomDate(29)]
      );
      commentIds.push({ id: result.id, authorId: commenterId });
    }
  }
}
console.log(`  Comments inserted: ${commentIds.length}`);

// Distribute comment likes (lighter rate)
for (const { id: commentId, authorId } of commentIds) {
  for (const likerId of allUserIds) {
    if (likerId === authorId) continue;
    if (Math.random() < 0.08) {
      await run(
        'INSERT OR IGNORE INTO comment_likes (user_id, comment_id) VALUES (?, ?)',
        [likerId, commentId]
      );
    }
  }
}
console.log('  Comment likes distributed.');

console.log('\nSeeding complete.');
