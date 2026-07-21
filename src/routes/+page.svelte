<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<div class="ws-shell flex min-h-[80vh] flex-col items-center justify-center text-center">
	<span class="ws-eyebrow">Wohnungssuche, ohne Floskeln</span>
	<h1 class="ws-title mt-3 text-4xl sm:text-5xl">Wohnschreiber</h1>
	<p class="ws-subtitle mt-4 max-w-md text-base">
		Lade deine Unterlagen einmal hoch, verlinke die Anzeige — wir schreiben ein Anschreiben, das
		wirklich auf die Wohnung eingeht.
	</p>

	<div class="mt-10 flex flex-wrap justify-center gap-3">
		<a href={resolve('/apply/new')} class="ws-btn ws-btn-primary">Neue Bewerbung schreiben</a>
		<a href={resolve('/documents')} class="ws-btn ws-btn-secondary">Dokumente verwalten</a>
		<a href={resolve('/profile')} class="ws-btn ws-btn-secondary">Profil bearbeiten</a>
	</div>

	<ol class="ws-subtitle mt-14 flex flex-col gap-2 text-left sm:flex-row sm:gap-8">
		<li class="flex items-center gap-2"><span class="ws-eyebrow">1</span> Profil & Dokumente</li>
		<li class="flex items-center gap-2"><span class="ws-eyebrow">2</span> Anzeige verlinken</li>
		<li class="flex items-center gap-2"><span class="ws-eyebrow">3</span> Anschreiben & PDF</li>
	</ol>
</div>
