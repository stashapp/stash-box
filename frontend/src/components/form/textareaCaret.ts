// Computes the pixel coordinates of a character position inside a textarea by
// mirroring its layout into a hidden div, dropping a marker span at the
// requested offset, and reading the span's position.
const MIRROR_PROPS = [
  "direction",
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
] as const;

export interface CaretCoordinates {
  top: number;
  left: number;
  height: number;
}

export const getCaretCoordinates = (
  el: HTMLTextAreaElement,
  position: number,
): CaretCoordinates => {
  const mirror = document.createElement("div");
  document.body.appendChild(mirror);
  const computed = window.getComputedStyle(el);

  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.top = "0";
  mirror.style.left = "0";

  MIRROR_PROPS.forEach((prop) => {
    mirror.style.setProperty(prop, computed.getPropertyValue(prop));
  });

  mirror.textContent = el.value.substring(0, position);
  const marker = document.createElement("span");
  // Non-empty content so the span has measurable layout even at end of text.
  marker.textContent = el.value.substring(position) || ".";
  mirror.appendChild(marker);

  const lineHeight =
    parseFloat(computed.lineHeight) || parseFloat(computed.fontSize);
  const coords: CaretCoordinates = {
    top: marker.offsetTop + parseFloat(computed.borderTopWidth),
    left: marker.offsetLeft + parseFloat(computed.borderLeftWidth),
    height: lineHeight,
  };

  document.body.removeChild(mirror);
  return coords;
};
