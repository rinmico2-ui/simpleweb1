/* Pixel Love — story configuration.
   Edit the LETTER text below to personalize the secret letter;
   the rest of the code stays untouched. */
const CONFIG = {
  title: 'A Little Something For You',
  subtitle: 'A tiny world, a little flower, and a message from someone special.',

  // --- The secret letter (Scene 7). Edit freely. ---
  LETTER:
`Hey,

I know this is just a little pixel world, but I wanted to make something special for you.

If I could give you something today, it would be a flower.

Not because flowers are perfect, but because they have a simple way of making an ordinary day feel beautiful.

I hope this little surprise brings a smile to your face.

You deserve all the beautiful things in this world.

And here's a little reminder:

You are special. Never forget that.`,

  // --- Dialogue script. Each line: { who: 'boy' | 'girl' | 'note', text } ---
  story: {
    scene1: [
      { who: 'boy', text: "Today feels like a perfect day to give someone something special." }
    ],
    scene2: [
      { who: 'boy', text: "I found something beautiful..." },
      { who: 'boy', text: "But I know someone who deserves it even more." }
    ],
    scene3: [
      { who: 'boy', text: "Maybe she'll like this flower." },
      { who: 'boy', text: "Hopefully, it makes her smile." },
      { who: 'boy', text: "Here goes nothing..." }
    ],
    scene4: [
      { who: 'girl', text: "Oh? Is that for me?" }
    ],
    scene5: [
      { who: 'boy',  text: "Um... I picked this for you." },
      { who: 'boy',  text: "Because you deserve something beautiful." },
      { who: 'girl', text: "Thank you! It's beautiful." }
    ]
  },

  totalChapters: 8,
  heartsTotal: 4
};
