import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

import racesData from '@/data/races.json'

export const Route = createFileRoute('/')({ component: CharacterSheet })

const CLASSES = [
	{ id: 'barbarian', name: 'Barbarian', hitDie: 12, saves: ['str', 'con'], primary: ['STR', 'CON'] },
	{ id: 'bard', name: 'Bard', hitDie: 8, saves: ['dex', 'cha'], primary: ['CHA', 'DEX'] },
	{ id: 'cleric', name: 'Cleric', hitDie: 8, saves: ['wis', 'cha'], primary: ['WIS', 'CON'] },
	{ id: 'druid', name: 'Druid', hitDie: 8, saves: ['int', 'wis'], primary: ['WIS', 'CON'] },
	{ id: 'fighter', name: 'Fighter', hitDie: 10, saves: ['str', 'con'], primary: ['STR or DEX', 'CON'] },
	{ id: 'monk', name: 'Monk', hitDie: 8, saves: ['str', 'dex'], primary: ['DEX', 'WIS'] },
	{ id: 'paladin', name: 'Paladin', hitDie: 10, saves: ['wis', 'cha'], primary: ['STR', 'CHA'] },
	{ id: 'ranger', name: 'Ranger', hitDie: 10, saves: ['str', 'dex'], primary: ['DEX or STR', 'WIS'] },
	{ id: 'rogue', name: 'Rogue', hitDie: 8, saves: ['dex', 'int'], primary: ['DEX', 'CON'] },
	{ id: 'sorcerer', name: 'Sorcerer', hitDie: 6, saves: ['con', 'cha'], primary: ['CHA', 'CON'] },
	{ id: 'warlock', name: 'Warlock', hitDie: 8, saves: ['wis', 'cha'], primary: ['CHA', 'CON'] },
	{ id: 'wizard', name: 'Wizard', hitDie: 6, saves: ['int', 'wis'], primary: ['INT', 'CON'] },
]

const SECTIONS = [
	{ id: 'basics', label: 'Basics' },
	{ id: 'stats', label: 'Stats' },
	{ id: 'combat', label: 'Combat' },
	{ id: 'skills', label: 'Skills' },
	{ id: 'attacks', label: 'Attacks' },
	{ id: 'features', label: 'Features' },
]

const ATTRIBUTES = [
	{ key: 'str', name: 'STR', fullName: 'Strength' },
	{ key: 'dex', name: 'DEX', fullName: 'Dexterity' },
	{ key: 'con', name: 'CON', fullName: 'Constitution' },
	{ key: 'int', name: 'INT', fullName: 'Intelligence' },
	{ key: 'wis', name: 'WIS', fullName: 'Wisdom' },
	{ key: 'cha', name: 'CHA', fullName: 'Charisma' },
]

const SKILLS = [
	{ name: 'Acrobatics', attr: 'dex' },
	{ name: 'Animal Handling', attr: 'wis' },
	{ name: 'Arcana', attr: 'int' },
	{ name: 'Athletics', attr: 'str' },
	{ name: 'Deception', attr: 'cha' },
	{ name: 'History', attr: 'int' },
	{ name: 'Insight', attr: 'wis' },
	{ name: 'Intimidation', attr: 'cha' },
	{ name: 'Investigation', attr: 'int' },
	{ name: 'Medicine', attr: 'wis' },
	{ name: 'Nature', attr: 'int' },
	{ name: 'Perception', attr: 'wis' },
	{ name: 'Performance', attr: 'cha' },
	{ name: 'Persuasion', attr: 'cha' },
	{ name: 'Religion', attr: 'int' },
	{ name: 'Sleight of Hand', attr: 'dex' },
	{ name: 'Stealth', attr: 'dex' },
	{ name: 'Survival', attr: 'wis' },
]

type Race = (typeof racesData.races)[number]
type Attributes = Record<string, number>
type SkillProficiency = 'none' | 'proficient' | 'expertise'
type SkillProficiencies = Record<string, SkillProficiency>
type SaveProficiencies = Record<string, boolean>
type Weapon = { name: string; attackBonus: string; damage: string; type: string }
type Feat = { name: string; description: string }
type RollMode = 'normal' | 'advantage' | 'disadvantage'
type RollResult = { label: string; rolls: number[]; kept: number; modifier: number; total: number; mode: RollMode }
type CharacterSheetState = {
	characterName: string
	characterClass: string
	level: number
	selectedRaceId: string
	background: string
	inspiration: boolean
	baseAttributes: Attributes
	saveProficiencies: SaveProficiencies
	skillProficiencies: SkillProficiencies
	armorClass: number
	initiativeBonus: number
	hitPointMax: number
	currentHitPoints: number
	tempHitPoints: number
	hitDiceUsed: number
	deathSaveSuccesses: boolean[]
	deathSaveFailures: boolean[]
	weapons: Weapon[]
	feats: Feat[]
}

const STORAGE_KEY = 'char-sheet:v1'
const SHARE_PARAM = 'sheet'
const DEFAULT_ATTRIBUTES: Attributes = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
const CLASS_ATTRIBUTE_DEFAULTS: Record<string, Attributes> = {
	barbarian: { str: 15, dex: 13, con: 15, int: 8, wis: 12, cha: 8 },
	bard: { str: 8, dex: 14, con: 13, int: 10, wis: 10, cha: 15 },
	cleric: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 10 },
	druid: { str: 8, dex: 14, con: 14, int: 10, wis: 15, cha: 8 },
	fighter: { str: 15, dex: 13, con: 15, int: 8, wis: 12, cha: 8 },
	monk: { str: 10, dex: 15, con: 13, int: 8, wis: 15, cha: 8 },
	paladin: { str: 15, dex: 8, con: 13, int: 8, wis: 12, cha: 15 },
	ranger: { str: 10, dex: 15, con: 13, int: 8, wis: 15, cha: 8 },
	rogue: { str: 8, dex: 15, con: 14, int: 13, wis: 12, cha: 8 },
	sorcerer: { str: 8, dex: 14, con: 15, int: 8, wis: 10, cha: 15 },
	warlock: { str: 8, dex: 14, con: 15, int: 8, wis: 10, cha: 15 },
	wizard: { str: 8, dex: 14, con: 15, int: 15, wis: 10, cha: 8 },
}
const DEFAULT_WEAPONS: Weapon[] = [
	{ name: '', attackBonus: '', damage: '', type: '' },
	{ name: '', attackBonus: '', damage: '', type: '' },
	{ name: '', attackBonus: '', damage: '', type: '' },
]
const DEFAULT_FEATS: Feat[] = [
	{ name: '', description: '' },
	{ name: '', description: '' },
	{ name: '', description: '' },
]
const DEFAULT_STATE: CharacterSheetState = {
	characterName: '',
	characterClass: '',
	level: 1,
	selectedRaceId: '',
	background: '',
	inspiration: false,
	baseAttributes: DEFAULT_ATTRIBUTES,
	saveProficiencies: {},
	skillProficiencies: {},
	armorClass: 10,
	initiativeBonus: 0,
	hitPointMax: 10,
	currentHitPoints: 10,
	tempHitPoints: 0,
	hitDiceUsed: 0,
	deathSaveSuccesses: [false, false, false],
	deathSaveFailures: [false, false, false],
	weapons: DEFAULT_WEAPONS,
	feats: DEFAULT_FEATS,
}

// 5e Point Buy costs: 8=0, 9=1, 10=2, 11=3, 12=4, 13=5, 14=7, 15=9
const POINT_BUY_COSTS: Record<number, number> = {
	8: 0,
	9: 1,
	10: 2,
	11: 3,
	12: 4,
	13: 5,
	14: 7,
	15: 9,
}

const POINT_BUY_TOTAL = 27
const POINT_BUY_MIN = 8
const POINT_BUY_MAX = 15

function getPointCost(score: number): number {
	if (score < POINT_BUY_MIN) return 0
	if (score > POINT_BUY_MAX) return POINT_BUY_COSTS[POINT_BUY_MAX] + (score - POINT_BUY_MAX) * 2
	return POINT_BUY_COSTS[score] ?? 0
}

function calculateTotalPoints(attrs: Attributes): number {
	return Object.values(attrs).reduce((sum, score) => sum + getPointCost(score), 0)
}

function generateRandomPointBuy(): Attributes {
	const attrs: Attributes = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
	const keys = Object.keys(attrs)
	let pointsRemaining = POINT_BUY_TOTAL

	// Shuffle the order we assign points
	const shuffledKeys = [...keys].sort(() => Math.random() - 0.5)

	// Keep assigning points randomly until we can't anymore
	let attempts = 0
	while (pointsRemaining > 0 && attempts < 1000) {
		attempts++
		const key = shuffledKeys[Math.floor(Math.random() * shuffledKeys.length)]
		const currentScore = attrs[key]

		if (currentScore >= POINT_BUY_MAX) continue

		const nextScore = currentScore + 1
		const costDiff = getPointCost(nextScore) - getPointCost(currentScore)

		if (costDiff <= pointsRemaining) {
			attrs[key] = nextScore
			pointsRemaining -= costDiff
		}
	}

	return attrs
}

function calculateModifier(score: number): number {
	return Math.floor((score - 10) / 2)
}

function formatModifier(mod: number): string {
	return mod >= 0 ? `+${mod}` : `${mod}`
}

function calculateSuggestedHP(hitDie: number, level: number, conModifier: number): number {
	const avgRoll = Math.floor(hitDie / 2) + 1
	const remainingLevelsHP = level > 1 ? (level - 1) * avgRoll : 0
	return hitDie + remainingLevelsHP + conModifier * level
}

function clampNumber(value: number, min: number, max: number): number {
	if (Number.isNaN(value)) return min
	return Math.min(Math.max(value, min), max)
}

function parseNumber(value: string, fallback: number, min: number, max: number): number {
	const nextValue = Number.parseInt(value, 10)
	return Number.isNaN(nextValue) ? fallback : clampNumber(nextValue, min, max)
}

function encodeSheetState(state: CharacterSheetState): string {
	return btoa(encodeURIComponent(JSON.stringify(state)))
}

function decodeSheetState(value: string): CharacterSheetState | null {
	try {
		return normalizeSheetState(JSON.parse(decodeURIComponent(atob(value))))
	} catch {
		return null
	}
}

function normalizeSheetState(value: unknown): CharacterSheetState {
	if (!value || typeof value !== 'object') return DEFAULT_STATE
	const state = value as Partial<CharacterSheetState>
	return {
		...DEFAULT_STATE,
		...state,
		level: clampNumber(Number(state.level ?? DEFAULT_STATE.level), 1, 20),
		baseAttributes: { ...DEFAULT_ATTRIBUTES, ...state.baseAttributes },
		saveProficiencies: state.saveProficiencies ?? {},
		skillProficiencies: state.skillProficiencies ?? {},
		deathSaveSuccesses: state.deathSaveSuccesses ?? DEFAULT_STATE.deathSaveSuccesses,
		deathSaveFailures: state.deathSaveFailures ?? DEFAULT_STATE.deathSaveFailures,
		weapons: state.weapons?.length ? state.weapons : DEFAULT_WEAPONS,
		feats: state.feats?.length ? state.feats : DEFAULT_FEATS,
	}
}

function CharacterSheet() {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const hasLoadedSavedSheet = useRef(false)
	const [characterName, setCharacterName] = useState(DEFAULT_STATE.characterName)
	const [characterClass, setCharacterClass] = useState(DEFAULT_STATE.characterClass)
	const [level, setLevel] = useState(DEFAULT_STATE.level)
	const [selectedRaceId, setSelectedRaceId] = useState(DEFAULT_STATE.selectedRaceId)
	const [background, setBackground] = useState(DEFAULT_STATE.background)
	const [inspiration, setInspiration] = useState(DEFAULT_STATE.inspiration)
	const [saveStatus, setSaveStatus] = useState('Ready')
	const [rollMode, setRollMode] = useState<RollMode>('normal')
	const [rollResult, setRollResult] = useState<RollResult | null>(null)

	// Base attributes (before racial bonuses) - start with point buy default (all 8s = 0 points)
	const [baseAttributes, setBaseAttributes] = useState<Attributes>(DEFAULT_STATE.baseAttributes)

	// Point buy calculation
	const pointsUsed = useMemo(() => calculateTotalPoints(baseAttributes), [baseAttributes])

	const [saveProficiencies, setSaveProficiencies] = useState<SaveProficiencies>(DEFAULT_STATE.saveProficiencies)
	const [skillProficiencies, setSkillProficiencies] = useState<SkillProficiencies>(DEFAULT_STATE.skillProficiencies)

	const [armorClass, setArmorClass] = useState(DEFAULT_STATE.armorClass)
	const [initiativeBonus, setInitiativeBonus] = useState(DEFAULT_STATE.initiativeBonus)
	const [hitPointMax, setHitPointMax] = useState(DEFAULT_STATE.hitPointMax)
	const [currentHitPoints, setCurrentHitPoints] = useState(DEFAULT_STATE.currentHitPoints)
	const [tempHitPoints, setTempHitPoints] = useState(DEFAULT_STATE.tempHitPoints)
	const [hitDiceUsed, setHitDiceUsed] = useState(DEFAULT_STATE.hitDiceUsed)

	const [deathSaveSuccesses, setDeathSaveSuccesses] = useState(DEFAULT_STATE.deathSaveSuccesses)
	const [deathSaveFailures, setDeathSaveFailures] = useState(DEFAULT_STATE.deathSaveFailures)

	const [weapons, setWeapons] = useState<Weapon[]>(DEFAULT_STATE.weapons)

	const [feats, setFeats] = useState<Feat[]>(DEFAULT_STATE.feats)

	const sheetState = useMemo<CharacterSheetState>(() => ({
		characterName,
		characterClass,
		level,
		selectedRaceId,
		background,
		inspiration,
		baseAttributes,
		saveProficiencies,
		skillProficiencies,
		armorClass,
		initiativeBonus,
		hitPointMax,
		currentHitPoints,
		tempHitPoints,
		hitDiceUsed,
		deathSaveSuccesses,
		deathSaveFailures,
		weapons,
		feats,
	}), [
		characterName,
		characterClass,
		level,
		selectedRaceId,
		background,
		inspiration,
		baseAttributes,
		saveProficiencies,
		skillProficiencies,
		armorClass,
		initiativeBonus,
		hitPointMax,
		currentHitPoints,
		tempHitPoints,
		hitDiceUsed,
		deathSaveSuccesses,
		deathSaveFailures,
		weapons,
		feats,
	])

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search)
		const sharedSheet = searchParams.get(SHARE_PARAM)
		const storedSheet = window.localStorage.getItem(STORAGE_KEY)
		let restoredSheet: CharacterSheetState | null = null

		try {
			restoredSheet = sharedSheet ? decodeSheetState(sharedSheet) : storedSheet ? normalizeSheetState(JSON.parse(storedSheet)) : null
		} catch {
			window.localStorage.removeItem(STORAGE_KEY)
			setSaveStatus('Saved sheet could not be loaded')
		}

		if (restoredSheet) {
			applySheetState(restoredSheet)
			setSaveStatus(sharedSheet ? 'Loaded from share link' : 'Loaded saved sheet')
		}

		hasLoadedSavedSheet.current = true
	}, [])

	useEffect(() => {
		if (!hasLoadedSavedSheet.current) return
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sheetState))
	}, [sheetState])

	// Get selected race data
	const selectedRace = useMemo(() => {
		return racesData.races.find((r) => r.id === selectedRaceId) as Race | undefined
	}, [selectedRaceId])

	// Calculate attributes with racial bonuses
	const attributes = useMemo(() => {
		const result = { ...baseAttributes }
		if (selectedRace?.attributeBonuses) {
			const bonuses = selectedRace.attributeBonuses as unknown as Record<string, number>
			for (const [attr, bonus] of Object.entries(bonuses)) {
				if (attr in result && typeof bonus === 'number') {
					result[attr] += bonus
				}
			}
		}
		return result
	}, [baseAttributes, selectedRace])

	// Get racial skill proficiencies
	const racialSkillProficiencies = useMemo(() => {
		if (!selectedRace?.skillProficiencies) return []
		return selectedRace.skillProficiencies.filter((s) => s !== 'choice')
	}, [selectedRace])

	// Speed from race
	const speed = selectedRace?.speed ?? 30

	// Proficiency bonus based on level
	const proficiencyBonus = Math.ceil(level / 4) + 1

	// Get selected class data
	const selectedClassData = useMemo(() => {
		return CLASSES.find((c) => c.id === characterClass)
	}, [characterClass])

	// Hit dice string
	const hitDiceTotal = level
	const hitDiceRemaining = hitDiceTotal - hitDiceUsed
	const hitDie = selectedClassData?.hitDie ?? 8
	const classDefaults = selectedClassData
		? `${selectedClassData.name}: d${selectedClassData.hitDie} hit die · saves ${selectedClassData.saves.map((save) => save.toUpperCase()).join(', ')} · focus ${selectedClassData.primary.join(' / ')}`
		: 'Choose a class to fill saves, hit die, and suggested HP.'

	function applySheetState(state: CharacterSheetState) {
		setCharacterName(state.characterName)
		setCharacterClass(state.characterClass)
		setLevel(state.level)
		setSelectedRaceId(state.selectedRaceId)
		setBackground(state.background)
		setInspiration(state.inspiration)
		setBaseAttributes(state.baseAttributes)
		setSaveProficiencies(state.saveProficiencies)
		setSkillProficiencies(state.skillProficiencies)
		setArmorClass(state.armorClass)
		setInitiativeBonus(state.initiativeBonus)
		setHitPointMax(state.hitPointMax)
		setCurrentHitPoints(state.currentHitPoints)
		setTempHitPoints(state.tempHitPoints)
		setHitDiceUsed(state.hitDiceUsed)
		setDeathSaveSuccesses(state.deathSaveSuccesses)
		setDeathSaveFailures(state.deathSaveFailures)
		setWeapons(state.weapons)
		setFeats(state.feats)
	}

	function updateCharacterClass(classId: string) {
		const nextClass = CLASSES.find((cls) => cls.id === classId)
		setCharacterClass(classId)
		if (!nextClass) return

		setSaveProficiencies(Object.fromEntries(nextClass.saves.map((save) => [save, true])))
		let nextConModifier = conModifier
		if (calculateTotalPoints(baseAttributes) === 0) {
			const classAttributes = CLASS_ATTRIBUTE_DEFAULTS[classId]
			setBaseAttributes(classAttributes)
			nextConModifier = calculateModifier(classAttributes.con)
		}
		const nextHP = calculateSuggestedHP(nextClass.hitDie, level, nextConModifier)
		setHitPointMax(nextHP)
		setCurrentHitPoints(nextHP)
		setHitDiceUsed((used) => clampNumber(used, 0, level))
	}

	function updateBaseAttribute(key: string, value: number) {
		setBaseAttributes((prev) => ({ ...prev, [key]: value }))
	}

	function updateLevel(value: string) {
		const nextLevel = parseNumber(value, level, 1, 20)
		setLevel(nextLevel)
		setHitDiceUsed((used) => clampNumber(used, 0, nextLevel))
	}

	function randomizeAttributes() {
		setBaseAttributes(generateRandomPointBuy())
	}

	function toggleSaveProficiency(key: string) {
		setSaveProficiencies((prev) => ({ ...prev, [key]: !prev[key] }))
	}

	function cycleSkillProficiency(skill: string) {
		setSkillProficiencies((prev) => {
			const current = prev[skill] || 'none'
			const next: SkillProficiency =
				current === 'none' ? 'proficient' : current === 'proficient' ? 'expertise' : 'none'
			return { ...prev, [skill]: next }
		})
	}

	function updateWeapon(index: number, field: keyof Weapon, value: string) {
		setWeapons((prev) => {
			const updated = [...prev]
			updated[index] = { ...updated[index], [field]: value }
			return updated
		})
	}

	function addWeapon() {
		setWeapons((prev) => [...prev, { name: '', attackBonus: '', damage: '', type: '' }])
	}

	function removeWeapon(index: number) {
		setWeapons((prev) => prev.filter((_, i) => i !== index))
	}

	function updateFeat(index: number, field: keyof Feat, value: string) {
		setFeats((prev) => {
			const updated = [...prev]
			updated[index] = { ...updated[index], [field]: value }
			return updated
		})
	}

	function addFeat() {
		setFeats((prev) => [...prev, { name: '', description: '' }])
	}

	function removeFeat(index: number) {
		setFeats((prev) => prev.filter((_, i) => i !== index))
	}

	async function copyShareLink() {
		const url = new URL(window.location.href)
		url.searchParams.set(SHARE_PARAM, encodeSheetState(sheetState))
		try {
			await window.navigator.clipboard.writeText(url.toString())
			setSaveStatus('Share link copied')
		} catch {
			setSaveStatus('Share link ready in the address bar')
			window.history.replaceState(null, '', url)
		}
	}

	function exportSheet() {
		const blob = new Blob([JSON.stringify(sheetState, null, 2)], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = `${characterName.trim() || 'character-sheet'}.json`
		link.click()
		URL.revokeObjectURL(url)
		setSaveStatus('Exported JSON')
	}

	async function importSheet(file: File | undefined) {
		if (!file) return
		try {
			const text = await file.text()
			applySheetState(normalizeSheetState(JSON.parse(text)))
			setSaveStatus('Imported JSON')
		} catch {
			setSaveStatus('Import failed')
		}
		if (fileInputRef.current) fileInputRef.current.value = ''
	}

	function clearSavedSheet() {
		applySheetState(DEFAULT_STATE)
		window.localStorage.removeItem(STORAGE_KEY)
		const url = new URL(window.location.href)
		url.searchParams.delete(SHARE_PARAM)
		window.history.replaceState(null, '', url)
		setRollResult(null)
		setSaveStatus('Started new sheet')
	}

	function toggleDeathSave(type: 'success' | 'failure', index: number) {
		if (type === 'success') {
			setDeathSaveSuccesses((prev) => {
				const updated = [...prev]
				updated[index] = !updated[index]
				return updated as [boolean, boolean, boolean]
			})
		} else {
			setDeathSaveFailures((prev) => {
				const updated = [...prev]
				updated[index] = !updated[index]
				return updated as [boolean, boolean, boolean]
			})
		}
	}

	function rollCheck(label: string, modifier: number) {
		const rolls = rollMode === 'normal'
			? [rollD20()]
			: [rollD20(), rollD20()]
		const kept = rollMode === 'disadvantage' ? Math.min(...rolls) : Math.max(...rolls)
		setRollResult({ label, rolls, kept, modifier, total: kept + modifier, mode: rollMode })
	}

	function rollD20(): number {
		return Math.floor(Math.random() * 20) + 1
	}

	function getSkillModifier(skill: { name: string; attr: string }): number {
		const attrMod = calculateModifier(attributes[skill.attr])
		const profLevel = skillProficiencies[skill.name] || 'none'
		const hasRacialProf = racialSkillProficiencies.includes(skill.name)

		let profBonus = 0
		if (profLevel === 'expertise') {
			profBonus = proficiencyBonus * 2
		} else if (profLevel === 'proficient' || hasRacialProf) {
			profBonus = proficiencyBonus
		}
		return attrMod + profBonus
	}

	function getSaveModifier(attrKey: string): number {
		const attrMod = calculateModifier(attributes[attrKey])
		const profBonus = saveProficiencies[attrKey] ? proficiencyBonus : 0
		return attrMod + profBonus
	}

	// Calculated values
	const conModifier = calculateModifier(attributes.con)
	const initiativeModifier = calculateModifier(attributes.dex) + initiativeBonus
	const passivePerception = 10 + getSkillModifier({ name: 'Perception', attr: 'wis' })

	// Suggested HP: (hit die max at level 1) + (average roll for remaining levels) + (CON mod * level)
	// Average roll = (hitDie / 2) + 1 for levels 2+
	const suggestedHP = useMemo(() => {
		if (!selectedClassData) return null
		return calculateSuggestedHP(selectedClassData.hitDie, level, conModifier)
	}, [selectedClassData, level, conModifier])

	return (
		<div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8 font-mono">
			<header className="text-center mb-8">
				<h1 className="text-3xl font-bold mb-2">character sheet builder</h1>
				<p className="text-muted-foreground">
					a little 5e character sheet builder
				</p>
			</header>

			<div className="sticky top-0 z-20 -mx-3 mb-4 border-y-2 bg-background/95 px-3 py-2 backdrop-blur lg:hidden">
				<nav aria-label="Sheet sections" className="flex gap-2 overflow-x-auto pb-1">
					{SECTIONS.map((section) => (
						<a
							key={section.id}
							href={`#${section.id}`}
							className="shrink-0 border-2 bg-card px-3 py-2 text-xs font-bold hover:bg-muted focus-visible:ring-ring/50 focus-visible:ring-[3px]"
						>
							{section.label}
						</a>
					))}
				</nav>
			</div>

			<Card className="w-full max-w-4xl mx-auto border-2 shadow-md">
				<CardHeader className="pb-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<CardDescription className="text-xs">
							Autosaves locally. {saveStatus}. Racial bonuses are automatic. Click skills to cycle proficiency.
						</CardDescription>
						<div className="flex flex-wrap gap-2">
							<button type="button" onClick={copyShareLink} className="border-2 bg-card px-3 py-2 text-xs font-bold hover:bg-muted">
								Share
							</button>
							<button type="button" onClick={exportSheet} className="border-2 bg-card px-3 py-2 text-xs font-bold hover:bg-muted">
								Export
							</button>
							<button type="button" onClick={() => fileInputRef.current?.click()} className="border-2 bg-card px-3 py-2 text-xs font-bold hover:bg-muted">
								Import
							</button>
							<button type="button" onClick={clearSavedSheet} className="border-2 bg-card px-3 py-2 text-xs font-bold hover:bg-muted">
								New
							</button>
						</div>
						<input
							ref={fileInputRef}
							type="file"
							accept="application/json"
							className="sr-only"
							onChange={(event) => void importSheet(event.target.files?.[0])}
							aria-label="Import character sheet JSON"
						/>
					</div>
					<CardDescription className="mt-3 border-2 bg-muted p-2 text-xs">
						{classDefaults}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Character Info Section */}
					<div id="basics" className="scroll-mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<div className="sm:col-span-2 lg:col-span-1">
							<Label htmlFor="name">Character Name</Label>
							<Input
								id="name"
								value={characterName}
								onChange={(e) => setCharacterName(e.target.value)}
								placeholder="Enter name"
							/>
						</div>
						<div>
							<Label htmlFor="level">Level</Label>
							<Input
								id="level"
								type="number"
								inputMode="numeric"
								min={1}
								max={20}
								value={level}
								onChange={(e) => updateLevel(e.target.value)}
							/>
						</div>
						<div>
							<Label htmlFor="class">Class</Label>
							<Select value={characterClass} onValueChange={updateCharacterClass}>
								<SelectTrigger id="class" className="w-full">
									<SelectValue placeholder="Select class" />
								</SelectTrigger>
								<SelectContent>
									{CLASSES.map((cls) => (
										<SelectItem key={cls.id} value={cls.id}>
											{cls.name} (d{cls.hitDie})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="race">Race</Label>
							<Select value={selectedRaceId} onValueChange={setSelectedRaceId}>
								<SelectTrigger id="race" className="w-full">
									<SelectValue placeholder="Select race" />
								</SelectTrigger>
								<SelectContent>
									{racesData.races.map((race) => (
										<SelectItem key={race.id} value={race.id}>
											{race.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="background">Background</Label>
							<Input
								id="background"
								value={background}
								onChange={(e) => setBackground(e.target.value)}
								placeholder="e.g. Soldier"
							/>
						</div>
						<div className="flex items-end gap-4">
							<div className="flex items-center gap-2">
								<Checkbox
									id="inspiration"
									checked={inspiration}
									onCheckedChange={(checked) => setInspiration(checked === true)}
								/>
								<Label htmlFor="inspiration" className="cursor-pointer">Inspiration</Label>
							</div>
							<div className="text-sm text-muted-foreground">
								Prof: <span className="font-bold text-foreground">+{proficiencyBonus}</span>
							</div>
						</div>
					</div>

					{selectedRace && (
						<div className="text-xs text-muted-foreground bg-muted p-2 border-2">
							<strong>{selectedRace.name}:</strong> Speed {selectedRace.speed}ft
							{selectedRace.attributeBonuses && (
								<span>
									{' | '}
									{Object.entries(selectedRace.attributeBonuses as unknown as Record<string, number>)
										.filter(([key]) => !key.startsWith('choice'))
										.map(([attr, bonus]) => `${attr.toUpperCase()} +${bonus}`)
										.join(', ')}
								</span>
							)}
							{racialSkillProficiencies.length > 0 && (
								<span> | Skills: {racialSkillProficiencies.join(', ')}</span>
							)}
						</div>
					)}

					<div className="flex flex-col gap-3 border-2 bg-muted p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="font-bold uppercase tracking-wide">Roll Mode</div>
							<div className="mt-2 flex gap-2" role="group" aria-label="Roll mode">
								{(['normal', 'advantage', 'disadvantage'] as RollMode[]).map((mode) => (
									<button
										key={mode}
										type="button"
										onClick={() => setRollMode(mode)}
										aria-pressed={rollMode === mode}
										className={`border-2 px-3 py-2 font-bold capitalize hover:bg-card ${rollMode === mode ? 'bg-secondary text-secondary-foreground' : 'bg-background'}`}
									>
										{mode === 'disadvantage' ? 'Disadv' : mode}
									</button>
								))}
							</div>
						</div>
						<div className="min-h-14 border-2 bg-background p-3 sm:min-w-72" aria-live="polite">
							{rollResult ? (
								<div>
									<div className="font-bold">{rollResult.label}: {rollResult.total}</div>
									<div className="text-muted-foreground">
										{rollResult.mode}: {rollResult.rolls.join(' / ')} kept {rollResult.kept} {formatModifier(rollResult.modifier)}
									</div>
								</div>
							) : (
								<span className="text-muted-foreground">Use Roll buttons on saves, skills, initiative, or attacks.</span>
							)}
						</div>
					</div>

					<Separator />

					{/* Main Grid */}
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						{/* Left Column - Attributes & Saves */}
						<div className="space-y-4">
							<div id="stats" className="scroll-mt-20">
								<div className="flex items-center justify-between mb-2">
									<h2 className="text-sm font-bold uppercase tracking-wide">Attributes</h2>
									<button
										type="button"
										onClick={randomizeAttributes}
										aria-label="Randomize attributes using point buy"
										className="text-xs bg-accent text-accent-foreground px-3 py-1.5 border-2 hover:bg-accent/80"
									>
										Random
									</button>
								</div>
								<div className="space-y-2">
									{ATTRIBUTES.map((attr) => {
										const baseValue = baseAttributes[attr.key]
										const totalValue = attributes[attr.key]
										const mod = calculateModifier(totalValue)
										const hasBonus = totalValue !== baseValue
										return (
											<div key={attr.key} className="flex items-center gap-2">
												<label htmlFor={`attr-${attr.key}`} className="w-10 text-xs font-bold">{attr.name}</label>
												<Input
													id={`attr-${attr.key}`}
													type="number"
													inputMode="numeric"
													min={1}
													max={20}
													value={baseValue}
													onChange={(e) => updateBaseAttribute(attr.key, parseNumber(e.target.value, baseValue, 1, 20))}
													className="w-16 text-center text-sm px-1"
												/>
												{hasBonus && (
													<span className="text-xs text-muted-foreground">→{totalValue}</span>
												)}
												<div className="w-10 text-center font-bold text-sm bg-secondary text-secondary-foreground border-2 px-2 py-1">
													{formatModifier(mod)}
												</div>
											</div>
										)
									})}
								</div>
								<div className={`text-xs mt-2 p-2 border-2 ${pointsUsed > POINT_BUY_TOTAL ? 'bg-destructive text-destructive-foreground' : pointsUsed === POINT_BUY_TOTAL ? 'bg-secondary text-secondary-foreground' : 'bg-muted'}`}>
									<strong>Point Buy:</strong> {pointsUsed} / {POINT_BUY_TOTAL}
									{pointsUsed > POINT_BUY_TOTAL && <span className="ml-2">(over budget!)</span>}
									{pointsUsed < POINT_BUY_TOTAL && <span className="ml-2">({POINT_BUY_TOTAL - pointsUsed} remaining)</span>}
								</div>
							</div>

							<div>
								<h2 className="text-sm font-bold mb-2 uppercase tracking-wide">Saving Throws</h2>
								<div className="space-y-1">
									{ATTRIBUTES.map((attr) => {
										const saveMod = getSaveModifier(attr.key)
										return (
											<div key={attr.key} className="flex items-center gap-2">
												<Checkbox
													id={`save-${attr.key}`}
													checked={saveProficiencies[attr.key] || false}
													onCheckedChange={() => toggleSaveProficiency(attr.key)}
												/>
												<Label htmlFor={`save-${attr.key}`} className="flex-1 text-xs cursor-pointer">
													{attr.fullName}
												</Label>
												<button
													type="button"
													onClick={() => rollCheck(`${attr.fullName} save`, saveMod)}
													className="w-12 border-2 bg-card px-1 py-1 text-right text-xs font-bold hover:bg-muted"
													aria-label={`Roll ${attr.fullName} saving throw`}
												>
													{formatModifier(saveMod)}
												</button>
											</div>
										)
									})}
								</div>
							</div>

							<div className="text-xs bg-muted p-2 border-2">
								<strong>Passive Perception:</strong> {passivePerception}
							</div>
						</div>

						{/* Middle Column - Combat & Skills */}
						<div className="space-y-4">
							<div id="combat" className="scroll-mt-20">
								<h2 className="text-sm font-bold mb-2 uppercase tracking-wide">Combat</h2>
								<div className="grid grid-cols-3 gap-2 mb-3">
									<div className="text-center">
										<Label htmlFor="ac" className="text-xs">AC</Label>
										<Input
											id="ac"
											type="number"
											inputMode="numeric"
											value={armorClass}
											onChange={(e) => setArmorClass(parseNumber(e.target.value, armorClass, 1, 40))}
											className="text-center font-bold"
										/>
									</div>
									<div className="text-center">
										<Label className="text-xs">Initiative</Label>
										<button
											type="button"
											onClick={() => rollCheck('Initiative', initiativeModifier)}
											className="h-9 w-full border-2 bg-secondary text-center font-bold text-secondary-foreground hover:bg-secondary/80"
											aria-label="Roll initiative"
										>
											{formatModifier(initiativeModifier)}
										</button>
									</div>
									<div className="text-center">
										<Label className="text-xs">Speed</Label>
										<div className="h-9 flex items-center justify-center font-bold bg-secondary text-secondary-foreground border-2">
											{speed}ft
										</div>
									</div>
								</div>

								<div className="grid grid-cols-3 gap-2 mb-2">
									<div>
										<Label htmlFor="hp-max" className="text-xs">HP Max</Label>
										<Input
											id="hp-max"
											type="number"
											inputMode="numeric"
											value={hitPointMax}
											onChange={(e) => setHitPointMax(parseNumber(e.target.value, hitPointMax, 1, 999))}
											className="text-center text-sm"
										/>
									</div>
									<div>
										<Label htmlFor="hp-current" className="text-xs">Current</Label>
										<Input
											id="hp-current"
											type="number"
											inputMode="numeric"
											value={currentHitPoints}
											onChange={(e) => setCurrentHitPoints(parseNumber(e.target.value, currentHitPoints, 0, 999))}
											className="text-center text-sm"
										/>
									</div>
									<div>
										<Label htmlFor="hp-temp" className="text-xs">Temp HP</Label>
										<Input
											id="hp-temp"
											type="number"
											inputMode="numeric"
											value={tempHitPoints}
											onChange={(e) => setTempHitPoints(parseNumber(e.target.value, tempHitPoints, 0, 999))}
											className="text-center text-sm"
										/>
									</div>
								</div>
								{suggestedHP !== null && (
									<div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
										<span>Suggested HP (avg): {suggestedHP}</span>
										<button
											type="button"
											onClick={() => {
												setHitPointMax(suggestedHP)
												setCurrentHitPoints(suggestedHP)
											}}
											className="border-2 bg-card px-2 py-1 font-bold text-foreground hover:bg-muted"
										>
											Use
										</button>
									</div>
								)}

								<div className="grid grid-cols-2 gap-2 mb-3">
									<div>
										<Label className="text-xs">Hit Dice</Label>
										<div className="h-9 flex items-center justify-center text-sm bg-secondary text-secondary-foreground border-2">
											{hitDiceRemaining}/{hitDiceTotal}d{hitDie}
										</div>
									</div>
									<div>
										<Label htmlFor="hit-dice-used" className="text-xs">Used</Label>
										<Input
											id="hit-dice-used"
											type="number"
											inputMode="numeric"
											min={0}
											max={hitDiceTotal}
											value={hitDiceUsed}
											onChange={(e) => setHitDiceUsed(parseNumber(e.target.value, hitDiceUsed, 0, hitDiceTotal))}
											className="text-center text-sm"
										/>
									</div>
								</div>

								<div className="text-xs">
									<Label className="text-xs mb-1 block">Death Saves</Label>
									<div className="flex gap-4">
										<div className="flex items-center gap-1">
											<span className="text-muted-foreground">S:</span>
											{[0, 1, 2].map((i) => (
												<Checkbox
													key={`success-${i}`}
													checked={deathSaveSuccesses[i]}
													onCheckedChange={() => toggleDeathSave('success', i)}
													aria-label={`Death save success ${i + 1}`}
												/>
											))}
										</div>
										<div className="flex items-center gap-1">
											<span className="text-muted-foreground">F:</span>
											{[0, 1, 2].map((i) => (
												<Checkbox
													key={`failure-${i}`}
													checked={deathSaveFailures[i]}
													onCheckedChange={() => toggleDeathSave('failure', i)}
													aria-label={`Death save failure ${i + 1}`}
												/>
											))}
										</div>
									</div>
								</div>
							</div>

							<div id="skills" className="scroll-mt-20">
								<h2 className="text-sm font-bold mb-2 uppercase tracking-wide">Skills</h2>
								<div className="space-y-0.5 text-xs">
									{SKILLS.map((skill) => {
										const skillMod = getSkillModifier(skill)
										const profLevel = skillProficiencies[skill.name] || 'none'
										const hasRacialProf = racialSkillProficiencies.includes(skill.name)
										const attrLabel = skill.attr.toUpperCase()
										return (
										<div
											key={skill.name}
											className="flex items-center gap-1 px-1 py-0.5"
										>
											<button
												type="button"
												className="flex flex-1 items-center gap-1 text-left hover:bg-muted"
												onClick={() => cycleSkillProficiency(skill.name)}
												aria-label={`${skill.name}: ${profLevel === 'expertise' ? 'expertise' : profLevel === 'proficient' ? 'proficient' : 'not proficient'}. Click to cycle.`}
											>
												<span className="w-4 text-center">
													{profLevel === 'expertise' ? '◆' : profLevel === 'proficient' ? '●' : hasRacialProf ? '○' : '○'}
												</span>
												<span className="flex-1">
													{skill.name} <span className="text-muted-foreground">({attrLabel})</span>
												</span>
											</button>
											<button
												type="button"
												onClick={() => rollCheck(skill.name, skillMod)}
												className="w-12 border-2 bg-card px-1 py-1 text-right font-bold hover:bg-muted"
												aria-label={`Roll ${skill.name}`}
											>
												{formatModifier(skillMod)}
											</button>
										</div>
									)
									})}
								</div>
								<div className="text-xs text-muted-foreground mt-2">
									○ none · ● proficient · ◆ expertise
								</div>
							</div>
						</div>

						{/* Right Column - Weapons & Feats */}
						<div className="space-y-4">
							<div id="attacks" className="scroll-mt-20">
								<div className="flex items-center justify-between mb-2">
									<h2 className="text-sm font-bold uppercase tracking-wide">Attacks</h2>
									<button
										type="button"
										onClick={addWeapon}
										aria-label="Add weapon"
										className="text-xs bg-accent text-accent-foreground px-3 py-1.5 border-2 hover:bg-accent/80"
									>
										+ Add
									</button>
								</div>
								<div className="space-y-3">
									{weapons.map((weapon, index) => {
										const isEmpty = !weapon.name && !weapon.attackBonus && !weapon.damage && !weapon.type
										return (
											<div key={index} className="space-y-4 pb-2 border-b border-border last:border-0 last:pb-0">
												<div className="flex gap-1">
													<Input
														value={weapon.name}
														onChange={(e) => updateWeapon(index, 'name', e.target.value)}
														placeholder="Weapon"
														aria-label={`Weapon ${index + 1} name`}
														className="text-sm flex-1"
													/>
													{isEmpty && weapons.length > 1 && (
														<button
															type="button"
															onClick={() => removeWeapon(index)}
															aria-label="Remove weapon"
															className="text-sm px-2 py-1 ml-1 font-extrabold hover:bg-muted"
														>
															−
														</button>
													)}
												</div>
												<div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1">
													<Input
														value={weapon.attackBonus}
														onChange={(e) => updateWeapon(index, 'attackBonus', e.target.value)}
														placeholder="+5"
														aria-label={`Weapon ${index + 1} attack bonus`}
														className="text-xs"
													/>
													<Input
														value={weapon.damage}
														onChange={(e) => updateWeapon(index, 'damage', e.target.value)}
														placeholder="1d8+3"
														aria-label={`Weapon ${index + 1} damage`}
														className="text-xs"
													/>
													<Input
														value={weapon.type}
														onChange={(e) => updateWeapon(index, 'type', e.target.value)}
														placeholder="Slash"
														aria-label={`Weapon ${index + 1} damage type`}
														className="text-xs"
													/>
													<button
														type="button"
														onClick={() => rollCheck(weapon.name || `Attack ${index + 1}`, Number.parseInt(weapon.attackBonus, 10) || 0)}
														className="border-2 bg-card px-2 py-1 text-xs font-bold hover:bg-muted"
														aria-label={`Roll weapon ${index + 1} attack`}
													>
														Roll
													</button>
												</div>
											</div>
										)
									})}
								</div>
							</div>

							<div id="features" className="scroll-mt-20">
								<div className="flex items-center justify-between mb-2">
									<h2 className="text-sm font-bold uppercase tracking-wide">Feats & Features</h2>
									<button
										type="button"
										onClick={addFeat}
										aria-label="Add feat"
										className="text-xs bg-accent text-accent-foreground px-3 py-1.5 border-2 hover:bg-accent/80"
									>
										+ Add
									</button>
								</div>
								<div className="space-y-3">
									{feats.map((feat, index) => {
										const isEmpty = !feat.name && !feat.description
										return (
											<div key={index} className="space-y-4 pb-2 border-b border-border last:border-0 last:pb-0">
												<div className="flex gap-1">
													<Input
														value={feat.name}
														onChange={(e) => updateFeat(index, 'name', e.target.value)}
														placeholder="Feat name"
														aria-label={`Feat ${index + 1} name`}
														className="text-sm flex-1"
													/>
													{isEmpty && feats.length > 1 && (
														<button
															type="button"
															onClick={() => removeFeat(index)}
															aria-label="Remove feat"
															className="text-sm px-2 py-1 ml-1 font-extrabold hover:bg-muted"
														>
															−
														</button>
													)}
												</div>
												<Input
													value={feat.description}
													onChange={(e) => updateFeat(index, 'description', e.target.value)}
													placeholder="Notes"
													aria-label={`Feat ${index + 1} description`}
													className="text-xs"
												/>
											</div>
										)
									})}
								</div>
							</div>

							<div>
								<Label htmlFor="initiative-bonus" className="text-xs">Initiative Bonus</Label>
								<Input
									id="initiative-bonus"
									type="number"
									inputMode="numeric"
									value={initiativeBonus}
									onChange={(e) => setInitiativeBonus(parseNumber(e.target.value, initiativeBonus, -20, 20))}
									placeholder="0"
									className="text-sm w-20"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									For feats like Alert (+5)
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<footer className="mt-8 pt-4 border-t text-xs text-muted-foreground text-center">
				Built by{" "}
				<a
					href="https://twitter.com/elithrar"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground"
				>
					Matt Silverlock
				</a>
			</footer>
		</div>
	)
}
