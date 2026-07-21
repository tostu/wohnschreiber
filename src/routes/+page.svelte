<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<div class="mx-auto max-w-xl px-4 py-16 text-center">
	<h1 class="text-3xl font-semibold">Wohnschreiber</h1>
	<p class="mt-2 text-gray-500">Personalisierte Anschreiben für deine Wohnungssuche.</p>

	<div class="mt-8 flex justify-center gap-3">
		<a
			href={resolve('/apply/new')}
			class="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
			>Neue Bewerbung</a
		>
		<a
			href={resolve('/documents')}
			class="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50">Dokumente verwalten</a
		>
		<a
			href={resolve('/profile')}
			class="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50">Profil</a
		>
	</div>
</div>
