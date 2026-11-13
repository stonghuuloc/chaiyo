<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import Button from '#lib/ui/Button.svelte';
	import { m } from '#lib/paraglide/messages.js';

	const points = [
		{ avatar: asset('onboard/avatars/redpanda.webp'), text: m.landing_point_han_viet() },
		{ avatar: asset('onboard/avatars/takin.webp'), text: m.landing_point_voices() },
		{ avatar: asset('onboard/avatars/panda.webp'), text: m.landing_point_path() },
		{ avatar: asset('onboard/avatars/fawn.webp'), text: m.landing_point_daily() }
	];
</script>

<svelte:head>
	<title>Chaiyo! {m.landing_title().replace(/\.$/, '')}</title>
	<meta name="description" content={m.landing_lede()} />
</svelte:head>

<main class="landing">
	<picture class="art">
		<source
			media="(min-width: 1024px)"
			srcset="{asset('onboard/landing-tall.webp')} 640w, {asset(
				'onboard/landing-tall-960.webp'
			)} 960w"
			sizes="480px"
			width="640"
			height="954"
		/>
		<source
			srcset="{asset('onboard/landing-wide.webp')} 860w, {asset(
				'onboard/landing-wide-1280.webp'
			)} 1264w"
			sizes="(min-width: 768px) 480px, min(100vw, 470px)"
		/>
		<img
			src={asset('onboard/landing-wide.webp')}
			alt={m.landing_art_alt()}
			width="860"
			height="577"
			fetchpriority="high"
		/>
	</picture>

	<div class="column">
		<img
			class="logo"
			src={asset('brand/logo-224.webp')}
			alt={m.landing_logo_alt()}
			width="96"
			height="96"
		/>
		<h1 class="title">{m.landing_title()}</h1>
		<p class="lede">{m.landing_lede()}</p>

		<ul class="points">
			{#each points as point (point.avatar)}
				<li>
					<img src={point.avatar} alt="" width="48" height="48" />
					<span>{point.text}</span>
				</li>
			{/each}
		</ul>

		<div class="actions">
			<Button href={resolve('/login')}>{m.landing_cta()}</Button>
			<a class="login" href={resolve('/login')}>{m.landing_login()}</a>
		</div>
	</div>
</main>

<style>
	.landing {
		--gutter: 20px;
		display: flex;
		flex-direction: column;
		max-width: calc(var(--container-column) + 2 * var(--gutter));
		margin-inline: auto;
		padding: 0 var(--gutter) 32px;
		text-align: center;
	}

	.art {
		display: block;
		min-width: 0;
		margin-inline: calc(-1 * var(--gutter));
		aspect-ratio: 3 / 2;
		overflow: hidden;
		mask-image: linear-gradient(var(--color-ink) 70%, transparent);
	}

	.art img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.logo {
		position: relative;
		margin: -48px auto 0;
		width: 96px;
		height: 96px;
	}

	.title {
		margin-top: 12px;
		font-size: var(--text-display);
		line-height: 1.1;
		text-wrap: balance;
	}

	.lede {
		margin-top: 8px;
		color: var(--color-graphite);
	}

	.points {
		display: grid;
		gap: 12px;
		margin-top: 24px;
		padding: 0;
		list-style: none;
		text-align: left;
	}

	.points li {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px;
		border-radius: var(--radius-cell);
		background: var(--color-white);
		font-weight: 500;
	}

	.points img {
		flex: none;
		width: 48px;
		height: 48px;
		border-radius: 12px;
		object-fit: cover;
	}

	.points span {
		text-wrap: balance;
	}

	.actions {
		display: grid;
		gap: 4px;
		margin-top: 32px;
	}

	.login {
		display: grid;
		place-items: center;
		min-height: 48px;
		font-family: var(--font-title);
		font-size: var(--text-title);
		font-weight: var(--text-title--font-weight);
	}

	@media (hover: hover) {
		.login:hover {
			text-decoration: underline;
		}
	}

	@media (min-width: 48rem) {
		.landing {
			--gutter: 32px;
			max-width: calc(var(--container-sheet) + 2 * var(--gutter));
		}

		.art {
			margin: 24px 0 0;
			border-radius: 24px;
			mask-image: none;
		}

		.logo {
			margin-top: 24px;
		}
	}

	@media (min-width: 64rem) {
		.landing {
			display: grid;
			grid-template-columns: minmax(0, var(--container-sheet)) var(--container-form);
			align-content: center;
			justify-content: center;
			gap: 80px;
			--gutter: 40px;
			max-width: none;
			min-height: 100dvh;
			padding: var(--gutter);
			text-align: left;
		}

		.art {
			margin: 0;
			aspect-ratio: auto;
		}

		.art img {
			object-position: 50% 40%;
		}

		.logo {
			margin: 0;
		}

		.actions {
			margin-top: 24px;
		}
	}
</style>
