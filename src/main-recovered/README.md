# Recovered process roots

This directory contains the checked-in exact source recovery for the main process, worker, and preload composition roots. The application build compiles these files directly. Files under `.reference/originals/main` are comparison baselines for audits and are not build inputs.

Typed semantic owners under `src/main/` are imported by these composition roots and remain the preferred location for newly recovered behavior.
