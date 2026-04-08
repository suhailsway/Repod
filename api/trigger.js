// Step 1: Transcribe with AssemblyAI
      const aaiSubmit = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': '81cc6dcff37243c992d7f498571c24fb',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_url: audio_url }),
      });
      const aaiJob = await aaiSubmit.json();
      const transcriptId = aaiJob.id;

      // Poll for completion
      let transcript = '';
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const aaiPoll = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: { 'Authorization': '81cc6dcff37243c992d7f498571c24fb' },
        });
        const aaiData = await aaiPoll.json();
        if (aaiData.status === 'completed') {
          transcript = aaiData.text || '';
          break;
        }
        if (aaiData.status === 'error') break;
      }