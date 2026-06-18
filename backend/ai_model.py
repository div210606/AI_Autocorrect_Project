import language_tool_python

tool = language_tool_python.LanguageTool("en-US")

def improve_text(text: str):
    matches = tool.check(text)
    corrected_text = language_tool_python.utils.correct(
        text,
        matches
    )
    return corrected_text