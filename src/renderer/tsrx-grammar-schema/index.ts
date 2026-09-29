// TSRX grammar composition schema. Release chunk: tsrx-grammar-schema-39f17e710f9c.js.
import "@rchunk/rolldown-runtime";
import * as AppShared from "@rchunk/app-shared";

interface Schema<Value> {
  parse(input: unknown): Value;
  optional(): Schema<Value | undefined>;
}

interface GrammarRule extends Record<string, unknown> {}

interface GrammarDefinition extends Record<string, unknown> {
  name: string;
  repository: Record<string, GrammarRule>;
}

const schemaRuntime = AppShared as unknown as {
  E4<Value>(schema: Schema<Value>): Schema<Value[]>;
  G4<Key extends string, Value>(key: Schema<Key>, value: Schema<Value>): Schema<Record<Key, Value>>;
  L4<Value>(factory: () => Schema<Value>): Schema<Value>;
  g4(): void;
  k4(): Schema<boolean>;
  q4(): Schema<string>;
  z4<Value extends Record<string, unknown>>(shape: Record<string, Schema<unknown>>): Schema<Value>;
};

let repositorySchema: Schema<Record<string, GrammarRule>>;
let grammarSchema: Schema<GrammarDefinition>;

function initializeTsrxGrammarSchema(): void {
  schemaRuntime.g4();
  let ruleSchema: Schema<GrammarRule>;
  ruleSchema = schemaRuntime.L4(() =>
    schemaRuntime.z4<GrammarRule>({
      include: schemaRuntime.q4().optional(),
      name: schemaRuntime.q4().optional(),
      contentName: schemaRuntime.q4().optional(),
      match: schemaRuntime.q4().optional(),
      captures: schemaRuntime.G4(schemaRuntime.q4(), ruleSchema).optional(),
      begin: schemaRuntime.q4().optional(),
      beginCaptures: schemaRuntime.G4(schemaRuntime.q4(), ruleSchema).optional(),
      end: schemaRuntime.q4().optional(),
      endCaptures: schemaRuntime.G4(schemaRuntime.q4(), ruleSchema).optional(),
      while: schemaRuntime.q4().optional(),
      whileCaptures: schemaRuntime.G4(schemaRuntime.q4(), ruleSchema).optional(),
      patterns: schemaRuntime.E4(ruleSchema).optional(),
      repository: schemaRuntime.G4(schemaRuntime.q4(), ruleSchema).optional(),
      applyEndPatternLast: schemaRuntime.k4().optional(),
    }),
  );
  repositorySchema = schemaRuntime.G4(schemaRuntime.q4(), ruleSchema);
  grammarSchema = schemaRuntime.z4<GrammarDefinition>({
    name: schemaRuntime.q4(),
    scopeName: schemaRuntime.q4(),
    patterns: schemaRuntime.E4(ruleSchema),
    repository: repositorySchema,
    injections: repositorySchema.optional(),
    injectionSelector: schemaRuntime.q4().optional(),
    fileTypes: schemaRuntime.E4(schemaRuntime.q4()).optional(),
    firstLineMatch: schemaRuntime.q4().optional(),
  });
}

function assembleTsrxGrammar(
  baseGrammar: unknown,
  declarationRepository: unknown,
  statementRepository: unknown,
  typeRepository: unknown,
): GrammarDefinition & { embeddedLangs: string[] } {
  const grammar = grammarSchema.parse(baseGrammar);
  return {
    ...grammar,
    name: "tsrx",
    repository: {
      ...grammar.repository,
      ...repositorySchema.parse(declarationRepository),
      ...repositorySchema.parse(statementRepository),
      ...repositorySchema.parse(typeRepository),
    },
    embeddedLangs: ["jsx", "tsx", "typescript", "css"],
  };
}

initializeTsrxGrammarSchema();

export { assembleTsrxGrammar };
